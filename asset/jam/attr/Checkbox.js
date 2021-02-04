/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
Jam.CheckboxModelAttr = class CheckboxModelAttr extends Jam.ModelAttr {

    constructor () {
        super(...arguments);
        this.$checkbox = this.find('[type="checkbox"]');
        this.$checkbox.change(this.onChangeCheckbox.bind(this));
    }

    getValue () {
        return this.$value.val() === 'true';
    }

    setValue (value) {
        this.$value.val(value ? 'true' : 'false');
        this.$checkbox.prop('checked', value);
    }

    enable (state) {
        this.$value.attr('readonly', !state);
        this.$checkbox.attr('disabled', !state);
        this.$value.closest('.checkbox').toggleClass('disabled', !state);
    }

    onChangeCheckbox (event) {
        this.$value.val(event.target.checked);
        this.triggerChange();
    }
};