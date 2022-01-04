/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
Jam.ListFilterTypeId = class ListFilterTypeId extends Jam.ListFilterTypeString {

    init () {
        super.init();
        this.nested = new Jam.ListFilterNested(this);
    }

    getValue () {
        return this.nested.active()
            ? this.nested.getValue()
            : super.getValue();
    }

    changeValue (value) {
        return this.nested.active()
            ? this.nested.parse(value)
            : this.setValue(value);
    }

    delete () {
        super.delete();
        this.nested.delete();
    }
};