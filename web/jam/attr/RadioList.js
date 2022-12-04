/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
Jam.RadioListModelAttr = class RadioListModelAttr extends Jam.ModelAttr {

    constructor () {
        super(...arguments);
        this.$radioItems = this.find('[type="radio"]');
        this.$radioItems.change(this.onChangeSelection.bind(this));
        this.setValueToItems();
    }

    getValueText () {
        return Jam.Helper.getLabelTextByValue(this.getValue(), this.$attr);
    }

    setValueToItems () {
        this.setValue(this.$value.val());
    }

    enable (state) {
        super.enable(state);
        this.$radioItems.attr('disabled', !state);
    }

    setValue (value) {
        this.$value.val(value);
        this.setRadioItem(value);
    }

    setRadioItem (value) {
        if (value === undefined || value === null) {
            value = '';
        }
        for (const radioItem of this.$radioItems) {
            radioItem.checked = radioItem.value === value;
        }
    }

    onChangeSelection ({target}) {
        if (target.checked) {
            this.$radioItems.not(target).prop('checked', false);
            this.$value.val(target.value);
            this.triggerChange();
        }
    }
};