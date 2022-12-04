/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
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
        this.model.triggerChange();
        setTimeout(() => this._skipTrigger = false, 0);
    }
};