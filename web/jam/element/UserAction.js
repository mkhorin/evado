/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

Jam.UserAction = class extends Jam.Element {

    static post ($element, params) {
        return this.confirm($element).then(() => {
            Jam.toggleGlobalLoader(true);
            return $.post($element.data('url'), params).always(()=> Jam.toggleGlobalLoader(false));
        });
    }

    static confirm ($element) {
        const message = $element.data('confirm');
        const method = $element.data('confirmMethod') || 'show';
        return message
            ? Jam.confirmation[method](message, $element.data('confirmParams'))
            : $.Deferred().resolve();
    }

    init () {
        this.$element.click(this.onClick.bind(this));
    }

    isActive () {
        return !this.$element.attr('disabled');
    }

    getParam (name) {
        return this.$element.data(name);
    }

    onClick (event) {
        event.preventDefault();
        if (this.isActive()) {
            this.execute();
        }
    }

    onDone (message) {
        if (this.getParam('reloadPage')) {
            return location.reload(true);
        }
        (new Jam.ContentNotice).success(message || 'Action is done');
    }

    onFail (message) {
        (new Jam.ContentNotice).danger(message || 'Action failed');
    }

    toggleActive (state) {
        state ? this.$element.attr('disabled', true)
              : this.$element.removeAttr('disabled');
    }

    toggleLoader (state) {
        if (this.getParam('globalLoader')) {
            return Jam.toggleGlobalLoader(state);
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