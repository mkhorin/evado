/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
Jam.ListFilterTypeBoolean = class ListFilterTypeBoolean extends Jam.ListFilterType {

    init () {
        super.init();
        this.getValueElement().change(this.onChangeValue.bind(this));
        this.changeValue();
    }

    onChangeValue () {
        const checked = this.getValueElement().is(':checked');
        this.setValue(checked ? 'true' : 'false');
    }

    changeValue (value) {
        return this.setValue(value).prop('checked', value === 'true');
    }
};