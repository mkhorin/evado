/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
Jam.UserAction = class UserAction extends Jam.Element {

    static post ($element, params) {
        return this.confirm($element).then(() => this.onConfirm($element, params));
    }

    static confirm ($element) {
        const message = $element.data('confirm');
        if (!message) {
            return $.when();
        }
        const method = $element.data('confirmMethod') || 'confirm';
        const params = $element.data('confirmParams');
        return Jam.dialog[method](message, params);
    }

    static onConfirm ($element, params) {
        Jam.showLoader();
        const url = $element.data('url');
        return Jam.post(url, params).always(() => Jam.hideLoader());
    }

    init () {
        this.$element.click(this.onClick.bind(this));
    }

    isActive () {
        return !this.$element.attr('disabled');
    }

    needSaveChanges () {
        const model = this.getModel();
        const message = this.getData('needSaveChanges');
        if (message && model?.isChanged()) {
            return Jam.dialog.alert(message);
        }
    }

    getAlert () {
        const model = this.getModel();
        return model
            ? model.alert
            : new Jam.MainAlert;
    }

    getModel () {
        const frame = Jam.frameStack.getLast();
        return frame
            ? Jam.Element.findInstanceByClass(Jam.Model, frame.$container)
            : null;
    }

    getParam (name, defaults) {
        const value = this.getData(name);
        return value !== undefined ? value : defaults;
    }

    onClick (event) {
        event.preventDefault();
        if (this.isActive() && !this.needSaveChanges()) {
            this.execute();
        }
    }

    onDone (message) {
        const alert = () => this.getAlert().success(message || 'Action completed');
        return this.getParam('reload')
            ? this.reload(alert)
            : alert();
    }

    reload (next) {
        const frame = Jam.frameStack.getLast();
        frame ? frame.reload().done(next)
              : location.reload(true);
    }

    onFail (message) {
        this.getAlert().danger(message || 'Action failed');
    }

    toggleActive (state) {
        state ? this.$element.attr('disabled', true)
              : this.$element.removeAttr('disabled');
    }

    toggleLoader (state) {
        if (this.getParam('globalLoader', true)) {
            return Jam.toggleLoader(state);
        }
        this.toggleClass('loading', state);
        this.toggleActive(state);
    }
};