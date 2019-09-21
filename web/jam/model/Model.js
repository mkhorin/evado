/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

Jam.Model = class extends Jam.Element {

    constructor ($form) {
        super($form);
        $form.submit(event => event.preventDefault());
        this.$form = $form;
        this.$attrs = $form.find('.form-attr');
        this.$container = $form.closest('.box');
        this.$header = this.$container.children('.box-header');
        this.$controls = this.$header.children('.model-controls');
        this.$content = this.$container.children('.box-body');
        this.$loader = this.$container.children('.model-loader');
        this.events = new Jam.Events('Model');
        this.tools = new Jam.ModelTools(this);
        this.notice = this.createNotice();
        this.params = $form.data('params') || {};
        this.saved = false;
        this.id = this.params.id;
        this.childModal = Jam.modal.create();
        this.modal = this.$container.closest('.jmodal').data('modal');
    }

    init () {
        this.$controls.on('click', '[data-id]', this.onControl.bind(this));
        this.beforeCloseMethod = this.beforeClose.bind(this);
        this.modal.onClose(this.beforeCloseMethod);
        this.grouper = new Jam.ModelGrouper(this);
        this.createAttrs();
        this.attraction = new Jam.ModelAttraction(this);
        if (this.params.hideEmptyGroups) {
            this.attraction.events.on('update', this.grouper.toggleEmpty.bind(this.grouper));
            this.grouper.toggleEmpty();
        }
        this.changeTracker = new Jam.ModelChangeTracker(this);
        this.error = new Jam.ModelError(this);
        this.utilManager = new Jam.UtilManager(this.$controls, this);
        this.changeTracker.start();
        this.behaviors = Jam.ClassHelper.spawnInstances(this.params.behaviors, {owner: this});
        this.behaviors.forEach(item => item.init());
    }

    createNotice () {
        return new Jam.Notice({
            container: this.$content,
            $scrollTo: this.$content
        });
    }

    createAttrs () {
        this.attrs = [];
        for (const attr of this.$attrs) {
            this.attrs.push(Jam.ModelAttr.create($(attr), this));
        }        
        for (const attr of this.attrs) {
            attr.init();
        }
    }

    isNew () {
        return !this.id;
    }

    getControl (id) {
        return this.$controls.find(`[data-id="${id}"]`);
    }

    getAction (id) {
        return this.$controls.find(`[data-action="${id}"]`);
    }

    getAttr (name, className) {
        return Jam.ModelAttr.get(this.getValueField(name, className));
    }

    getAttrByElement (element) {
        return $(element).closest('.form-attr');
    }

    getValueField (name, className) {
        return this.$form.find(`[name="${this.formatAttrName(name, className)}"]`);
    }

    getValueFieldByAttr ($attr) {
        return $attr.find('[name]');
    }

    formatAttrName (name, className = this.params.className) {
        return name.includes('[') ? name : `${className}[${name}]`;
    }

    beforeClose (event) {
        if (this.changeTracker.isChanged() && !Jam.Helper.confirm('Close without saving?')) {
            return event.stopPropagation();
        }
        const message = this.inProgress();
        if (message && !Jam.Helper.confirm(message)) {
            return event.stopPropagation();
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

    translate (message) {
        return Jam.ObjectHelper.getValueLabel(message, this.params.messages);
    }

    // CONTROLS

    onControl (event) {
        this.beforeControl(event);
        this.getControlMethod(event.currentTarget.dataset.id).call(this, event);
    }

    beforeControl () {
        this.notice.hide();
    }

    getControlMethod (id) {
        switch (id) {
            case 'saveClose': return this.onSaveClose;
            case 'save': return this.onSave;
            case 'cancel': return this.onCancel;
            case 'view': return this.onView;
            case 'update': return this.onUpdate;
            case 'remove': return this.onRemove;
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

    onRemove () {
        Jam.dialog.confirmRemove().then(this.removeModel.bind(this));
    }

    onReload () {
        this.modal.off('beforeClose', this.beforeCloseMethod);
        this.modal.reload();
    }

    onCopyId () {
        Jam.Helper.copyToClipboard(this.id);
    }

    onShowHistory () {
        this.childModal.load(this.getControl('history').data('url'));
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
        Jam.Helper.post(this.$form, this.params.url, this.$form.serialize()).done(data => {
            this.saved = true;
            this.reopen = reopen;
            this.id = data;
            this.changeTracker.reset();
            this.modal.close();
        }).fail(xhr => {
            this.error.parse(xhr.responseJSON || xhr.responseText);
        }).always(()=> {
            this.$loader.hide();
        });
    }

    removeModel () {
        this.$loader.show();
        Jam.Helper.post(this.$form, this.params.remove, {id: this.id}).done(()=> {
            this.saved = true;
            this.changeTracker.reset();
            this.modal.close();
        }).fail(xhr => {
            this.notice.danger(xhr.responseText || xhr.statusText);
            this.$loader.hide();
        });
    }

    // ATTR UPDATE

    isAttrUpdate () {
        return this.$container.hasClass('attr-update');
    }

    initAttrUpdate () {
        if (this.isAttrUpdate()) {
            const $attr = this.$form.find('.form-attr');
            const $title = this.modal.$modal.find('.jmodal-title');
            $title.html($attr.data('label'));
            if ($attr.hasClass('required')) {
                $title.addClass('required');
            }
        }
    }
};

Jam.ModelChangeTracker = class {

    constructor (form) {
        this.form = form;
        this.$form = form.$form;
    }

    isChanged () {
        return this._data !== this.$form.serialize();
    }

    reset () {
        this._data = this.$form.serialize();
    }

    start () {
        this.reset();
        this.$form.on('change keyup','[name]', event => {
            this.form.events.trigger('change', event.target);
        });
    }
};