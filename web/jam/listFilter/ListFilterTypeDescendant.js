/**
 * @copyright Copyright (c) 2022 Maxim Khorin <maksimovichu@gmail.com>
 */
Jam.ListFilterTypeDescendant = class ListFilterTypeDescendant extends Jam.ListFilterType {

    init () {
        super.init();
        this.createItems();
        this.getValueElement().change(this.onChangeValue.bind(this));
    }

    createItems () {
        this.params.hasEmpty = true;
        const items = Jam.SelectHelper.renderOptions(this.params);
        const $element = this.getValueElement().html(items);
        $element.select2({
            placeholder: Jam.t('Select a descendant class...')
        });
    }

    onChangeValue () {
        this.createNested();
        const name = this.getDescendantName();
        if (name) {
            this.params.columns = this.getColumns(name);
            this.nested = new Jam.ListFilterNested(this);
            this.nested.onAddCondition();
        }
    }

    createNested () {
        this.deleteNested();
        const name = this.getDescendantName();
        if (name) {
            this.params.columns = this.getColumns(name);
            this.nested = new Jam.ListFilterNested(this);
        }
    }

    getDescendantName () {
        return this.getValueElement().val();
    }

    getColumns (value) {
        for (const item of this.params.items) {
            if (item.value === value) {
                return item.columns;
            }
        }
    }

    focus () {
        if (this.getSelect2()) {
            this.getValueElement().select2('open');
        }
    }

    getValue () {
        return this.nested?.getValue();
    }

    changeValue (value, data) {
        this.setValue(data.class).change();
        this.nested?.parse(value);
        if (this.getSelect2()) {
            this.getValueElement().select2('close');
        }
    }

    serialize (data) {
        data.class = this.getDescendantName();
        delete data.attr;
        delete data.op;
        return super.serialize(data);
    }

    delete () {
        super.delete();
        this.deleteNested();
    }

    deleteNested () {
        this.nested?.delete();
        this.nested = null;
    }
};