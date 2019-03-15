'use strict';

Ant.Model = class {

    static init (modal, selector) {
        modal.$modal.find(selector || '.ant-model').each((index, element)=> {
            this.create($(element));
        });
    }

    static create ($form) {
        return this.get($form) || Reflect.construct(this, arguments);
    }

    static get ($form) {
        return $form.data('ant-model');
    }

    constructor ($form) {
        $form.data('ant-model', this);
        $form.submit(event => event.preventDefault());

        this.$form = $form;
        this.$attrs = $form.find('.form-attr');
        this.$container = $form.closest('.box');
        this.$header = this.$container.children('.box-header');
        this.$controls = this.$header.children('.model-controls');
        this.$content = this.$container.children('.box-body');
        this.$loader = this.$container.children('.model-loader');
        this.event = new Ant.Event(this.constructor.name);
        this.tools = new Ant.ModelTools(this);
        this.notice = new Ant.Notice({
            'container': this.$content,
            '$scrollTo': this.$content
        });
        this.params = $form.data('params') || {};
        this.saved = false;
        this.id = this.params.id;
        this.isNewObject = !this.id;
        this.childModal = Ant.modal.create();
        this.modal = this.$container.closest('.ant-modal').data('modal');

        this.getControl('saveClose').click(this.save.bind(this, false));
        this.getControl('save').click(this.save.bind(this, true));
        this.getControl('cancel').click(this.cancel.bind(this));
        this.getControl('view').click(this.view.bind(this));
        this.getControl('update').click(this.update.bind(this));
        this.getControl('remove').click(this.remove.bind(this));
        this.getControl('copyId').click(this.copyId.bind(this));
        this.getControl('reload').click(this.reload.bind(this));
        this.getControl('postAction').click(this.postAction.bind(this));
        this.getControl('modal-action').click(this.modalAction.bind(this));

        this.$history = this.getControl('history');
        this.$history.click(this.showHistory.bind(this));
        this.init();
    }

    init () {
        this.beforeCloseMethod = this.beforeClose.bind(this);
        this.modal.onClose(this.beforeCloseMethod);
        this.grouper = new Ant.ModelGrouper(this);
        this.$attrs.each((index, element)=> Ant.ModelAttr.create($(element), this));
        this.attraction = new Ant.ModelAttraction(this);
        if (this.params.hideEmptyGroups) {
            this.attraction.event.on('update', this.grouper.toggleEmpty.bind(this.grouper));
            this.grouper.toggleEmpty();
        }
        this.setInitValue();
        this.errors = new Ant.ModelError(this);
        this.utilTools = new Ant.UtilTools(this.$controls);
        this.trackChanges();
    }

    getControl (id) {
        return this.$controls.find(`[data-id="${id}"]`);
    }

    getAttrByName (name, className) {
        return Ant.ModelAttr.get(this.getValueFieldByName(name, className));
    }

    getValueFieldByName (name, className) {
        return this.$form.find(`[name="${this.formatAttrName(name, className)}"]`);
    }

    getAttrByInner (element) {
        return $(element).closest('.form-attr');
    }

    getValueFieldByAttr ($attr) {
        return $attr.find('.form-value');
    }

    formatAttrId (id, className) {
        return `#${this.params.timestamp}-${className || this.params.className}-${id}`;
    }

    formatAttrName (name, className) {
        return name.indexOf('[') === -1 ? `${className || this.params.className}[${name}]` : name;
    }

    beforeClose (event) {
        if (this.isChanged() && !Ant.Helper.confirm('Close without saving?')) {
            event.stopPropagation();
        }
        event.data = {
            'result': this.id,
            'saved': this.saved,
            'reopen': this.reopen
        };
    }

    translate (message) {
        return Ant.ObjectHelper.getValueLabel(message, this.params.messages);
    }

    // ACTIONS

    cancel () {
        this.setInitValue();
        this.modal.close();
    }

    save (reopen) {
        if (this.validate()) {
            this.forceSave(reopen);
        }
    }

    view () {
        this.childModal.load(this.params.view, {'id': this.id});
    }

    update () {
        this.childModal.load(this.params.update, {'id': this.id});
    }

    remove () {
        if (!Ant.Helper.confirm('Delete this object?')) {
            return false;
        }
        this.$loader.show();
        $.post(this.params.remove, {
            'ids': this.id
        }).done(()=> {
            this.saved = true;
            this.setInitValue();
            this.modal.close();
        }).fail(xhr => {
            this.notice.danger(xhr.responseText || xhr.statusText);
            this.$loader.hide();
        });
    }

    copyId (event) {
        Ant.Helper.copyToClipboard(this.id);
    }

    reload () {
        this.modal.off('beforeClose', this.beforeCloseMethod);
        this.modal.reload();
    }

    postAction (event) {
        this.$loader.show();
        this.notice.hide();
        let $btn = $(event.currentTarget);
        Ant.postAction($btn).done(data => {
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
        this.childModal.one('closed', (event, data)=> {
            if (data && data.saved && $btn.data('success')) {
                this.notice.success(btn.data('success'));
            }
        });
    }

    forceSave (reopen) {
        this.$loader.show();
        this.notice.hide();
        $.post(this.params.url, this.$form.serialize()).done(data => {
            this.saved = true;
            this.reopen = reopen;
            this.id = data;
            this.setInitValue();
            this.modal.close();
        }).fail(xhr => {
            this.errors.parse(xhr.responseJSON || xhr.responseText);
        }).always(()=> {
            this.$loader.hide();
        });
    }

    // VALIDATE

    validate () {
        let uploader = this.$form.find('.uploader').data('uploader');
        if (uploader && !uploader.isFinished()) {
            return false;
        }
        return true;
    }

    // TRACK CHANGES

    isChanged () {
        return this._initValue !== this.$form.serialize();
    }

    setInitValue () {
        this._initValue = this.$form.serialize();
    }

    trackChanges () {
        this.$form.find('[name]').on('change keyup', event => {
            this.event.trigger('change');
        });
    }

    // ATTR UPDATE

    isAttrUpdate () {
        return this.$container.hasClass('attr-update');
    }

    initAttrUpdate () {
        if (this.isAttrUpdate()) {
            let $attr = this.$form.find('.form-attr');
            let $title = this.modal.$modal.find('.ant-modal-title');
            $title.html($attr.data('label'));
            $attr.hasClass('required') && $title.addClass('required');
        }
    }

    // HISTORY

    showHistory () {
        this.childModal.load(this.$history.data('url'));
    }
};