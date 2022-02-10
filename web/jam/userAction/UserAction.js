/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
Jam.UserAction = class UserAction extends Jam.Element {

    static post ($element, params) {
        return this.confirm($element).then(() => this.onConfirm($element, params));
    }

    static confirm ($element) {
        const method = $element.data('confirmMethod') || 'confirm';
        const message = $element.data('confirm');
        return message
            ? Jam.dialog[method](message, $element.data('confirmParams'))
            : $.when();
    }

    static onConfirm ($element, params) {
        Jam.toggleLoader(true);
        return Jam.post($element.data('url'), params).always(() => Jam.toggleLoader(false));
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
        return model ? model.alert : new Jam.MainAlert;
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
        return this.getParam('reload') ? this.reload(alert) : alert();
    }

    reload (next) {
        const frame = Jam.frameStack.getLast();
        frame ? frame.reload().done(next) : location.reload(true);
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