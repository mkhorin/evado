/**
 * @copyright Copyright (c) 2022 Maxim Khorin <maksimovichu@gmail.com>
 */
Jam.RelationCheckboxListModelAttr = class RelationCheckboxListModelAttr extends Jam.CheckboxListModelAttr {

    constructor () {
        super(...arguments);
        this.createChanges();
    }

    createChanges () {
        this.changes = new Jam.RelationChanges(this);
        this.changes.setDefaultValue(this.getValue());
        this.changes.setInitialValue(this.getInitialValue());
        this.setCheckboxes(this.changes.getValues());
        this.setValueByChanges();
    }

    getInitialValue () {
        if (!this.changes.hasLinks()) {
            const data = this.$attr.data('value');
            if (typeof data === 'string' && data) {
                return data.split(',');
            }
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
        return !!this.getDependencyValue();
    }

    getDependencyValue () {
        const values = this.getCheckedValues();
        return values.length ? values : null;
    }

    getLinkedValue () {
        return this.changes.links;
    }

    getValueText () {
        return this.getDependencyValue();
    }

    setValue (value) {
        this.$value.val(value);
    }

    onChangeSelection ({target}) {
        const value = target.value;
        target.checked
            ? this.changes.linkValue(value)
            : this.changes.unlinkValue(value);
        if (this.setValueByChanges()) {
            this.triggerChange();
        }
    }
};