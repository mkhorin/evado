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
        this.getControl('saveClose').click(this.save.bind(this, false));
        this.getControl('save').click(this.save.bind(this, true));
        this.getControl('cancel').click(this.cancel.bind(this));
        this.getControl('view').click(this.view.bind(this));
        this.getControl('update').click(this.update.bind(this));
        this.getControl('remove').click(this.remove.bind(this));
        this.getControl('copyId').click(this.copyId.bind(this));
        this.getControl('reload').click(this.reload.bind(this));
        this.getControl('postAction').click(this.postAction.bind(this));
        this.getControl('modalAction').click(this.modalAction.bind(this));

        this.$history = this.getControl('history');
        this.$history.click(this.showHistory.bind(this));

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
    }

    createNotice () {
        return new Jam.Notice({
            container: this.$content,
            $scrollTo: this.$content
        });
    }

    createAttrs () {
        this.attrs = [];
        for (let attr of this.$attrs) {
            this.attrs.push(Jam.ModelAttr.create($(attr), this));
        }        
        for (let attr of this.attrs) {
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

    getAttrByName (name, className) {
        return Jam.ModelAttr.get(this.getValueFieldByName(name, className));
    }

    getAttrByElement (element) {
        return $(element).closest('.form-attr');
    }

    getValueFieldByName (name, className) {
        return this.$form.find(`[name="${this.formatAttrName(name, className)}"]`);
    }

    getValueFieldByAttr ($attr) {
        return $attr.find('.form-value');
    }

    formatAttrName (name, className = this.params.className) {
        return name.indexOf('[') === -1 ? `${className}[${name}]` : name;
    }

    beforeClose (event) {
        if (this.changeTracker.isChanged() && !Jam.Helper.confirm('Close without saving?')) {
            return event.stopPropagation();
        }
        let message = this.inProgress();
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

    // ACTIONS

    cancel () {
        this.changeTracker.reset();
        this.modal.close();
    }

    save (reopen) {        
        if (this.validate()) {
            this.forceSave(reopen);
        }
    }

    view () {
        this.childModal.load(this.params.view, {id: this.id});
    }

    update () {
        this.childModal.load(this.params.update, {id: this.id});
    }

    remove () {
        Jam.confirmation.showRemove().then(this.removeHandler.bind(this));
    }

    removeHandler () {
        this.$loader.show();
        $.post(this.params.remove, {id: this.id}).done(()=> {
            this.saved = true;
            this.changeTracker.reset();
            this.modal.close();
        }).fail(xhr => {
            this.notice.danger(xhr.responseText || xhr.statusText);
            this.$loader.hide();
        });
    }

    copyId (event) {
        Jam.Helper.copyToClipboard(this.id);
    }

    reload () {
        this.modal.off('beforeClose', this.beforeCloseMethod);
        this.modal.reload();
    }

    postAction (event) {
        this.$loader.show();
        this.notice.hide();
        let $btn = $(event.currentTarget);
        Jam.UserAction.post($btn).done(data => {
            this.notice.success(data);
        }).fail(xhr => {
            xhr && this.notice.danger(xhr.responseText || xhr.statusText);
        }).always(()=> {
            this.$loader.hide();
        });
    }

    modalAction (event) {
        let $btn = $(event.currentTarget);
        this.notice.hide();
        this.childModal.load($btn.data('url'), $btn.data('params'));
        this.childModal.one('afterClose', (event, data)=> {
            if (data && data.saved) {
                data.result && this.notice.success(data.result);
            }
        });
    }

    forceSave (reopen) {
        this.$loader.show();
        this.notice.hide();
        this.events.trigger('beforeSave');
        $.post(this.params.url, this.$form.serialize()).done(data => {
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

    // VALIDATE

    validate () {
        let data = {valid: true};
        this.events.trigger('beforeValidate', data);
        return data.valid;
    }

    // ATTR UPDATE

    isAttrUpdate () {
        return this.$container.hasClass('attr-update');
    }

    initAttrUpdate () {
        if (this.isAttrUpdate()) {
            let $attr = this.$form.find('.form-attr');
            let $title = this.modal.$modal.find('.jmodal-title');
            $title.html($attr.data('label'));
            $attr.hasClass('required') && $title.addClass('required');
        }
    }

    // HISTORY

    showHistory () {
        this.childModal.load(this.$history.data('url'));
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
        this.$form.find('[name]').on('change keyup', event => {
            this.form.events.trigger('change');
        });
    }
};