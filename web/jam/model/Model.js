/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
Jam.Model = class Model extends Jam.Element {

    constructor ($form) {
        super($form);
        $form.submit(event => event.preventDefault());
        this.$form = $form;
        this.$container = $form.closest('.frame-box');
        this.$header = this.$container.children('.frame-box-header');
        this.$commands = this.$header.children('.commands');
        this.$content = this.$container.children('.frame-box-body');
        this.events = new Jam.Events('Model');
        this.tools = new Jam.ModelTools(this);
        this.alert = this.createAlert();
        this.params = $form.data('params') || {};
        this.saved = false;
        this.id = this.params.id;
        this.childFrame = Jam.frameStack.createFrame();
        this.frame = Jam.frameStack.getFrame(this.$container);
    }

    init () {
        if (this.isReadOnly()) {
            this.setReadOnly();
        }
        this.$commands.on('click', '[data-command]', this.onCommand.bind(this));
        this.beforeCloseMethod = this.beforeClose.bind(this);
        this.frame.onClose(this.beforeCloseMethod);
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

    createAlert () {
        return new Jam.Alert({
            container: this.$content,
            $scrollTo: this.$content
        });
    }

    createAttrs () {
        this.attrs = Jam.ModelAttr.createAll(this.$form, this);
    }

    appendAttrs ($container) {
        const changed = this.isChanged();
        this.attrs.push(...Jam.ModelAttr.createAll($container, this));
        this.actionBinder.appendElements($container);
        if (this.params.hideEmptyGroups) {
            this.grouping.toggleEmpty();
        }
        if (!changed) {
            this.changeTracker.reset();
        }
    }

    getAttr (name, className) {
        return Jam.ModelAttr.get(this.findAttrValueByName(name, className));
    }

    getAttrByElement (element) {
        return Jam.ModelAttr.get(this.findAttr(element));
    }

    findAttrValueByName (name, className) {
        name = this.formatAttrName(name, className);
        return this.$form.find('.form-value').filter(`[name="${name}"]`);
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
        const confirmation = this.params.closeConfirmation;
        if (this.isChanged() && confirmation !== false) {
            event.deferred = Jam.dialog.confirm(confirmation || 'Close without saving?');
        }
        const message = this.inProgress();
        if (message) {
            event.deferred = $.when(event.deferred).then(() => Jam.dialog.confirm(message));
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

    onCommand (event) {
        this.beforeCommand(event);
        this.getCommandMethod(event.currentTarget.dataset.command)?.call(this, event);
    }

    beforeCommand () {
        this.alert.hide();
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
        this.frame.close();
    }

    onView () {
        this.childFrame.load(this.params.view, {id: this.id});
    }

    onUpdate () {
        this.childFrame.load(this.params.update, {id: this.id});
    }

    onDelete () {
        Jam.dialog.confirmDeletion().then(this.deleteModel.bind(this));
    }

    onReload () {
        this.reload();
    }

    onCopyId () {
        Jam.Helper.copyToClipboard(this.id);
    }

    onShowHistory () {
        this.childFrame.load(this.findCommand('history').data('url'));
    }

    reload () {
        this.frame.off('beforeClose', this.beforeCloseMethod);
        this.frame.reload();
    }

    validate () {
        const data = {valid: true};
        this.events.trigger('beforeValidate', data);
        return data.valid;
    }

    forceSave (reopen) {
        this.toggleLoader(true);
        this.events.trigger('beforeSave');
        this.reopen = reopen;
        return Jam.post(this.params.url, $.param(this.serialize()))
            .done(this.onDoneSaving.bind(this))
            .fail(this.onFailSaving.bind(this));
    }

    onDoneSaving (data) {
        this.saved = true;
        this.id = data;
        this.changeTracker.reset();
        this.events.trigger('afterSave');
        this.frame.close();
    }

    onFailSaving (data) {
        this.error.parseXhr(data);
        this.toggleLoader(false);
    }

    deleteModel () {
        this.toggleLoader(true);
        return Jam.post(this.params.delete, {id: this.id})
            .done(this.onDoneDeletion.bind(this))
            .fail(this.onFailDeletion.bind(this));
    }

    onDoneDeletion () {
        this.saved = true;
        this.changeTracker.reset();
        this.events.trigger('afterDelete');
        this.frame.close();
    }

    onFailDeletion (data) {
        this.alert.danger(data.responseText || data.statusText);
        this.toggleLoader(false);
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

    toggleLoader (state) {
        this.$container.toggleClass('loading', state);
    }
};