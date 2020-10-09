/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

Jam.UserAction = class UserAction extends Jam.Element {

    static post ($element, params) {
        return this.confirm($element).then(() => {
            Jam.toggleGlobalLoader(true);
            return Jam.Helper.post($element.data('url'), params)
                .always(()=> Jam.toggleGlobalLoader(false));
        });
    }

    static confirm ($element) {
        const message = $element.data('confirm');
        const method = $element.data('confirmMethod') || 'confirm';
        return message
            ? Jam.dialog[method](message, $element.data('confirmParams'))
            : $.when();
    }

    init () {
        this.$element.click(this.onClick.bind(this));
    }

    isActive () {
        return !this.$element.attr('disabled');
    }

    needSaveChanges () {
        const model = this.getModel();
        const message = this.$element.data('needSaveChanges');
        if (message && model && model.isChanged()) {
            return Jam.dialog.alert(message);
        }
    }

    getNotice () {
        const model = this.getModel();
        return model ? model.notice : new Jam.ContentNotice;
    }

    getModel () {
        const frame = Jam.modalStack.getLast();
        return frame
            ? Jam.Element.findInstanceByClass(Jam.Model, frame.$container)
            : null;
    }

    getParam (name, defaults) {
        const value = this.$element.data(name);
        return value !== undefined ? value : defaults;
    }

    onClick (event) {
        event.preventDefault();
        if (this.isActive() && !this.needSaveChanges()) {
            this.execute();
        }
    }

    onDone (message) {
        const notice = ()=> this.getNotice().success(message || 'Action completed');
        return this.getParam('reload') ? this.reload(notice) : notice();
    }

    reload (callback) {
        const frame = Jam.modalStack.getLast();
        frame ? frame.reload().done(callback) : location.reload(true);
    }

    onFail (message) {
        this.getNotice().danger(message || 'Action failed');
    }

    toggleActive (state) {
        state ? this.$element.attr('disabled', true)
              : this.$element.removeAttr('disabled');
    }

    toggleLoader (state) {
        if (this.getParam('globalLoader', true)) {
            return Jam.toggleGlobalLoader(state);
        }
        this.$element.toggleClass('loading', state);
        this.toggleActive(state);
    }
};

Jam.ModalUserAction = class ModalUserAction extends Jam.UserAction {

    execute () {
        Jam.ContentNotice.clear();
        this.constructor.confirm(this.$element).then(() => {
            const frame = Jam.modalStack.createFrame();
            frame.load(this.getParam('url'), this.getParam('params'));
            frame.one('afterClose', (event, data) => this.onDone(data.result));
        });
    }

    onDone (data) {
        if (data) {
            super.onDone(data);
        }
    }
};

Jam.PostUserAction = class PostUserAction extends Jam.UserAction {

    execute () {
        Jam.ContentNotice.clear();
        Jam.UserAction.post(this.$element)
            .done(data => this.onDone(data))
            .fail(data => data && this.onFail(data.responseText));
    }
};