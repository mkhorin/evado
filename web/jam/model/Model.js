/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

Jam.Model = class Model extends Jam.Element {

    constructor ($form) {
        super($form);
        $form.submit(event => event.preventDefault());
        this.$form = $form;
        this.$container = $form.closest('.box');
        this.$header = this.$container.children('.box-header');
        this.$commands = this.$header.children('.model-commands');
        this.$content = this.$container.children('.box-body');
        this.$loader = this.$container.children('.model-loader');
        this.events = new Jam.Events('Model');
        this.tools = new Jam.ModelTools(this);
        this.notice = this.createNotice();
        this.params = $form.data('params') || {};
        this.saved = false;
        this.id = this.params.id;
        this.childModal = Jam.modalStack.createFrame();
        this.modal = Jam.modalStack.getFrame(this.$container);
    }

    init () {
        if (this.isReadOnly()) {
            this.setReadOnly();
        }
        this.$commands.on('click', '[data-command]', this.onCommand.bind(this));
        this.beforeCloseMethod = this.beforeClose.bind(this);
        this.modal.onClose(this.beforeCloseMethod);
        this.grouping = new Jam.ModelGrouping(this);
        this.createAttrs();
        this.validation = new Jam.ModelValidation(this);
        this.actionBinder = new Jam.ActionBinder(this);
        if (this.params.hideEmptyGroups) {
            this.actionBinder.events.on('update', this.grouping.toggleEmpty.bind(this.grouping));
            this.grouping.toggleEmpty();
        }
        this.changeTracker = new Jam.ModelChangeTracker(this);
        this.error = new Jam.ModelError(this);
        this.changeTracker.start();
        this.behaviors = Jam.ClassHelper.spawnInstances(this.params.behaviors, {owner: this});
        this.behaviors.forEach(item => item.init());
    }

    isChanged () {
        return this.changeTracker.isChanged();
    }

    isNew () {
        return !this.id;
    }

    isReadOnly () {
        return this.params.readOnly;
    }

    createNotice () {
        return new Jam.Notice({
            container: this.$content,
            $scrollTo: this.$content
        });
    }

    createAttrs () {
        this.attrs = [];
        for (const attr of this.$form.find('.form-attr')) {
            this.attrs.push(Jam.ModelAttr.create($(attr), this));
        }        
        for (const attr of this.attrs) {
            attr.init();
        }
    }

    getAttr (name, className) {
        return Jam.ModelAttr.get(this.findAttrValueByName(name, className));
    }

    getAttrByElement (element) {
        return Jam.ModelAttr.get(this.findAttr(element));
    }

    findAttrValueByName (name, className) {
        return this.$form.find('.form-value').filter(`[name="${this.formatAttrName(name, className)}"]`);
    }

    findAttrValue (element) {
        return this.findAttr(element).find('.form-value');
    }

    findAttr (element) {
        return $(element).closest('.form-attr');
    }

    formatAttrName (name, className = this.params.className) {
        return typeof name !== 'string' || name.includes('[') ? name : `${className}[${name}]`;
    }

    findAction (name) {
        return this.$commands.find(`[data-action="${name}"]`);
    }

    findCommand (name) {
        return this.$commands.find(`[data-command="${name}"]`);
    }

    beforeClose (event) {
        let confirmation = this.params.closeConfirmation;
        if (this.isChanged() && confirmation !== false) {
            event.deferred = Jam.dialog.confirm(confirmation || 'Close without saving?');
        }
        const message = this.inProgress();
        if (message) {
            event.deferred = Jam.Helper.addDeferred(()=> Jam.dialog.confirm(message), event.deferred);
        }
        event.data = {
            result: this.id,
            saved: this.saved,
            reopen: this.reopen
        };
    }

    inProgress () {
        return this.attrs.map(attr => attr.inProgress()).filter(message => message)[0];
    }

    setReadOnly () {
        this.params.closeConfirmation = false;
        this.findCommand('saveClose').attr('disabled', true).removeAttr('data-command');
        this.findCommand('save').attr('disabled', true).removeAttr('data-command');
    }

    serialize () {
        const data = {};
        for (const element of this.$form.find('.form-value')) {
            data[element.name] = element.value;
        }
        Object.assign(data, this.serializeAttrs());
        data.dependency = this.getDependencyData();
        return data;
    }

    serializeAttrs () {
        const data = {};
        for (const attr of this.attrs) {
            const name = attr.getName();
            const value = attr.serialize();
            if (value === undefined && value === null) {
                delete data[name];
            } else {
                data[name] = value;
            }
        }
        return data;
    }

    stringifyAttrs () {
        return $.param(this.serializeAttrs());
    }

    translate (message) {
        return Jam.ObjectHelper.getValueLabel(message, this.params.messages);
    }

    // COMMANDS

    onCommand (event) {
        this.beforeCommand(event);
        const method = this.getCommandMethod(event.currentTarget.dataset.command);
        method && method.call(this, event);
    }

    beforeCommand () {
        this.notice.hide();
    }

    getCommandMethod (name) {
        switch (name) {
            case 'saveClose': return this.onSaveClose;
            case 'save': return this.onSave;
            case 'cancel': return this.onCancel;
            case 'view': return this.onView;
            case 'update': return this.onUpdate;
            case 'delete': return this.onDelete;
            case 'reload': return this.onReload;
            case 'sort': return this.onSort;
            case 'copyId': return this.onCopyId;
            case 'history': return this.onShowHistory;
        }
    }

    onSaveClose () {
        if (this.validate()) {
            this.forceSave();
        }
    }

    onSave () {
        if (this.validate()) {
            this.forceSave(true);
        }
    }

    onCancel () {
        this.changeTracker.reset();
        this.modal.close();
    }

    onView () {
        this.childModal.load(this.params.view, {id: this.id});
    }

    onUpdate () {
        this.childModal.load(this.params.update, {id: this.id});
    }

    onDelete () {
        Jam.dialog.confirmDeletion().then(this.deleteModel.bind(this));
    }

    onReload () {
        this.modal.off('beforeClose', this.beforeCloseMethod);
        this.modal.reload();
    }

    onCopyId () {
        Jam.Helper.copyToClipboard(this.id);
    }

    onShowHistory () {
        this.childModal.load(this.findCommand('history').data('url'));
    }

    // VALIDATE

    validate () {
        const data = {valid: true};
        this.events.trigger('beforeValidate', data);
        return data.valid;
    }

    // METHODS

    forceSave (reopen) {
        this.$loader.show();
        this.events.trigger('beforeSave');
        const data = $.param(this.serialize());
        return Jam.Helper.post(this.params.url, data).done(data => {
            this.saved = true;
            this.reopen = reopen;
            this.id = data;
            this.changeTracker.reset();
            this.events.trigger('afterSave');
            this.modal.close();
        }).fail(data => {
            this.error.parseXhr(data);
        }).always(() => {
            this.$loader.hide();
        });
    }

    deleteModel () {
        this.$loader.show();
        return Jam.Helper.post(this.params.delete, {id: this.id}).done(()=> {
            this.saved = true;
            this.changeTracker.reset();
            this.events.trigger('afterDelete');
            this.modal.close();
        }).fail(data => {
            this.notice.danger(data.responseText || data.statusText);
            this.$loader.hide();
        });
    }

    getDependencyData (attr) {
        const data = {};
        const attrs = attr ? [attr] : this.attrs;
        for (const attr of attrs) {
            const names = attr.getDependencyNames();
            if (Array.isArray(names)) {
                this.setDependencyValues(names, data);
            }
        }
        return data;
    }

    setDependencyValues (names, data) {
        for (const name of names) {
            const attr = this.getAttr(name);
            if (attr) {
                data[name] = attr.getDependencyValue();
            } else {
                console.error(`Dependency attribute not found: ${name}`);
            }
        }
    }
};

Jam.ModelChangeTracker = class ModelChangeTracker {

    constructor (model) {
        this.model = model;
    }

    isChanged () {
        return this._data !== this.model.stringifyAttrs();
    }

    reset () {
        this._data = this.model.stringifyAttrs();
    }

    start () {
        this.reset();
        this.model.$form.on('change keyup', '.form-value', this.onChange.bind(this));
    }

    onChange (event) {
        this.triggerAttr = this.model.getAttrByElement(event.target);
        if (!this._skipTrigger) {
            this.startTriggerAttr = this.triggerAttr;
        }
        this._skipTrigger = true;
        this.model.events.trigger('change');
        setTimeout(() => this._skipTrigger = false, 0);
    }
};