/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
Jam.RadioListModelAttr = class RadioListModelAttr extends Jam.ModelAttr {

    constructor () {
        super(...arguments);
        this.$radioItems = this.find('[type="radio"]');
        this.$radioItems.change(this.onChangeValue.bind(this));
        this.setValue(this.$value.val());
    }

    enable (state) {
        this.$value.attr('readonly', !state);
        this.$radioItems.attr('readonly', !state);
    }

    setValue (value) {
        this.$value.val(value);
        this.$radioItems.prop('checked', false);
        this.$radioItems.filter(`[value="${value}"]`).prop('checked', true);
    }

    onChangeValue (event) {
        if (event.target.checked) {
            this.$radioItems.not(event.target).prop('checked', false);
            this.$value.val($(event.target).val());
            this.triggerChange();
        }
    }
};