/**
 * @copyright Copyright (c) 2022 Maxim Khorin <maksimovichu@gmail.com>
 */
Jam.ListFilterTypeNested = class ListFilterTypeNested extends Jam.ListFilterType {

    init () {
        super.init();
        this.nested = new Jam.ListFilterNested(this);
        this.nested.onAddCondition();
    }

    getValue () {
        return this.nested?.getValue();
    }

    changeValue (value) {
        this.nested?.parse(value);
    }

    delete () {
        super.delete();
        this.nested?.delete();
        this.nested = null;
    }

    serialize (data) {
        return {
            items: data.value,
            or: data.or
        };
    }
};