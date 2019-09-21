/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

Jam.UserAction = class extends Jam.Element {

    static post ($element, params) {
        return this.confirm($element).then(() => {
            Jam.toggleMainLoader(true);
            return Jam.Helper.post($element, $element.data('url'), params)
                .always(()=> Jam.toggleMainLoader(false));
        });
    }

    static confirm ($element) {
        const message = $element.data('confirm');
        const method = $element.data('confirmMethod') || 'confirm';
        return message
            ? Jam.dialog[method](message, $element.data('confirmParams'))
            : $.Deferred().resolve();
    }

    init () {
        this.$element.click(this.onClick.bind(this));
    }

    isActive () {
        return !this.$element.attr('disabled');
    }

    getNotice () {
        const model = this.getModel();
        return model ? model.notice : new Jam.ContentNotice;
    }

    getModel () {
        const modal = Jam.modal.getLast();
        return modal ? Jam.Element.findInstanceByParent(Jam.Model, modal.$container) : null;
    }

    getParam (name, defaults) {
        const value = this.$element.data(name);
        return value !== undefined ? value : defaults;
    }

    onClick (event) {
        event.preventDefault();
        if (this.isActive()) {
            this.execute();
        }
    }

    onDone (message) {
        const notice = ()=> this.getNotice().success(message || 'Action completed');
        return this.getParam('reload') ? this.reload(notice) : notice();
    }

    reload (callback) {
        const modal = Jam.modal.getLast();
        modal ? modal.reload().done(callback) : location.reload(true);
    }

    onFail (message) {
        this.getNotice().danger(message || 'Action failed');
    }

    toggleActive (state) {
        state ? this.$element.attr('disabled', true)
              : this.$element.removeAttr('disabled');
    }

    toggleLoader (state) {
        if (this.getParam('mainLoader', true)) {
            return Jam.toggleMainLoader(state);
        }
        this.$element.toggleClass('loading', state);
        this.toggleActive(state);
    }
};

Jam.ModalUserAction = class extends Jam.UserAction {

    execute () {
        Jam.ContentNotice.clear();
        this.constructor.confirm(this.$element).then(()=> {
            const modal = Jam.modal.create();
            modal.load(this.getParam('url'), this.getParam('params'));
            modal.one('afterClose', (event, data)=> this.onDone(data.result));
        });
    }

    onDone (data) {
        if (data) {
            super.onDone(data);
        }
    }
};

Jam.PostUserAction = class extends Jam.UserAction {

    execute () {
        Jam.ContentNotice.clear();
        Jam.UserAction.post(this.$element)
            .done(data => this.onDone(data))
            .fail(xhr => xhr && this.onFail(xhr.responseText));
    }
};