/**
 * @copyright Copyright (c) 2022 Maxim Khorin <maksimovichu@gmail.com>
 */
Jam.RelationRadioListModelAttr = class RelationRadioListModelAttr extends Jam.RadioListModelAttr {

    constructor () {
        super(...arguments);
        this.createChanges();
    }

    createChanges () {
        this.changes = new Jam.RelationChanges(this);
        const defaultValue = this.getValue();
        this.changes.setDefaultValue(defaultValue);
        const initialValue = this.getInitialValue();
        this.changes.setInitialValue(initialValue);
        const value = this.changes.getValues()[0];
        this.setRadioItem(value);
        this.setValueByChanges();
    }

    getInitialValue () {
        if (!this.changes.hasLinks()) {
            return this.$attr.data('value');
        }
    }

    setValueByChanges () {
        const value = this.changes.serialize();
        if (this.getValue() !== value) {
            this.setValue(value);
            return true;
        }
    }

    hasValue () {
        return !!this.getActualValue();
    }

    getActualValue () {
        return this.$radioItems.filter(':checked').attr('value');
    }

    getLinkedValue () {
        return this.changes.links[0];
    }

    getValueText () {
        const value = this.getActualValue();
        return Jam.Helper.getLabelTextByValue(value, this.$attr);
    }

    setValue (value) {
        this.$value.val(value);
    }

    setInitialValue () {
        this.setValue(null);
        this.setRadioItem();
    }

    onChangeSelection ({target}) {
        this.$radioItems.not(target).prop('checked', false);
        this.changes.clearLinks();
        const {value} = target;
        if (value) {
            this.changes.linkValue(value);
        }
        this.changes.unlinkCurrentValue(value);
        if (this.setValueByChanges()) {
            this.triggerChange();
        }
    }
};