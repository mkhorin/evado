/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
Jam.LastValueStoreBehavior = class LastValueStoreBehavior extends Jam.Behavior {

    constructor () {
        super(...arguments);
        this.model = this.owner.model;
        this.defaultValue = this.owner.getValue();
        this.owner.find('[data-value]').click(this.onValue.bind(this));
        this.setStorageValue();
        this.model.events.one('afterSave', this.onSaveModel.bind(this));
    }

    getStorageKey () {
        return this.model.params.url + this.owner.getName();
    }

    onDefaultValue () {
        this.owner.setValue(this.defaultValue);
    }

    onValue (event) {
        this.owner.setValue(event.currentTarget.dataset.value);
    }

    onSaveModel () {
        Jam.localStorage.set(this.getStorageKey(), this.owner.getValue());
    }

    setStorageValue () {
        const value = Jam.localStorage.get(this.getStorageKey());
        if (value) {
            this.owner.setValue(value);
        }
    }
};