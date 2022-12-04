/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
Jam.CheckboxListModelAttr = class CheckboxListModelAttr extends Jam.ModelAttr {

    constructor () {
        super(...arguments);
        this.$checkboxes = this.find('[type="checkbox"]');
        this.$checkboxes.change(this.onChangeSelection.bind(this));
        this.allValue = this.getData('all');
        this.allValue = this.allValue === true ? 'all' : this.allValue;
        this.setValue(this.$value.val());
    }

    enable (state) {
        super.enable(state);
        this.$checkboxes.attr('disabled', !state);
    }

    setValue (value) {
        this.$value.val(value);
        this.setCheckboxes(value);
    }

    setCheckboxes (data) {
        const values = this.prepareValues(data);
        for (const checkbox of this.$checkboxes) {
            checkbox.checked = values.includes(checkbox.value);
        }
    }

    prepareValues (data) {
        if (typeof data === 'string') {
            return data.split(',');
        }
        return Array.isArray(data) ? data : [];
    }

    onChangeSelection (event) {
        this.resolveAllValue($(event.currentTarget));
        this.$value.val(this.getCheckedValues());
        this.triggerChange();
    }

    getCheckedValues () {
        const $checked = this.$checkboxes.filter(':checked');
        return $.map($checked, checkbox => checkbox.value);
    }

    resolveAllValue ($target) {
        const value = this.allValue;
        if (value && $target.is(':checked')) {
            const selector = `[value="${value}"]`;
            const $checkboxes = $target.val() === value
                ? this.$checkboxes.not(selector)
                : this.$checkboxes.filter(selector);
            $checkboxes.prop('checked', false);
        }
    }
};