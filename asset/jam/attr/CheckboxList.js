/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
Jam.CheckboxListModelAttr = class CheckboxListModelAttr extends Jam.ModelAttr {

    constructor () {
        super(...arguments);
        this.$checks = this.find('[type="checkbox"]');
        this.$checks.change(this.onChangeCheckbox.bind(this));
        this.allValue = this.getData('all');
        this.allValue = this.allValue === true ? 'all' : this.allValue;
        this.setValue(this.$value.val());
    }

    enable (state) {
        this.$value.attr('readonly', !state);
        this.$checks.attr('disabled', !state);
        this.$checks.closest('.checkbox').toggleClass('disabled', !state);
    }

    setValue (value) {
        this.$value.val(value);
        this.$checks.prop('checked', false);
        value = Array.isArray(value) ? value : typeof value === 'string' ? value.split(',') : [];
        for (const val of value) {
            this.$checks.filter(`[value="${val}"]`).prop('checked', true);
        }
    }

    extractValues () {
        const values = [];
        for (const item of this.$checks.filter(':checked')) {
            values.push($(item).val());
        }
        return values;
    }

    onChangeCheckbox (event) {
        this.resolveAllValue($(event.currentTarget));
        this.$value.val(this.extractValues());
        this.triggerChange();
    }

    resolveAllValue ($target) {
        if (this.allValue && $target.is(':checked')) {
            $target.val() === this.allValue
                ? this.$checks.not(`[value="${this.allValue}"]`).prop('checked', false)
                : this.$checks.filter(`[value="${this.allValue}"]`).prop('checked', false);
        }
    }
};