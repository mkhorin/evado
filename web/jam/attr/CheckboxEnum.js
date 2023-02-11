/**
 * @copyright Copyright (c) 2022 Maxim Khorin <maksimovichu@gmail.com>
 */
Jam.CheckboxEnumModelAttr = class CheckboxEnumModelAttr extends Jam.ModelAttr {

    init () {
        super.init();
        this.valueType = this.$attr.data('valueType');
        this.sets = Jam.EnumSet.createSets(this.getData('sets'), this);
        this.$list = this.find('.form-check-list');
        this.$list.on('change', '[type="checkbox"]', this.onChangeSelection.bind(this));
        this.model.events.on('change', this.onUpdate.bind(this));
        setTimeout(this.onUpdate.bind(this), 0);
    }

    getCheckboxes () {
        return this.$list.find('[type="checkbox"]');
    }

    getCheckbox (value) {
        return this.getCheckboxes().filter(`[value="${value}"]`);
    }

    enable (state) {
        super.enable(state);
        this.getCheckboxes().attr('disabled', !state);
    }

    setValue (data) {
        let values = this.parseValues(data);
        this.setCheckboxes(values);
        values = this.getCheckedValues();
        let value = this.serializeValues(values);
        this.$value.val(value);
    }

    parseValues (data) {
        if (typeof data === 'string') {
            data = this.valueType === 'json'
                ? Jam.Helper.parseJson(data)
                : data.split(',');
        }
        return Array.isArray(data) ? data : [data];
    }

    setCheckboxes (values) {
        const checkboxes = this.getCheckboxes();
        for (const checkbox of checkboxes) {
            checkbox.checked = values.includes(checkbox.value);
        }
    }

    onChangeSelection () {
        const values = this.getCheckedValues();
        this.$value.val(this.serializeValues(values));
        this.$value.change();
    }

    getCheckedValues () {
        const $checked = this.getCheckboxes().filter(':checked');
        return $.map($checked, checkbox => checkbox.value);
    }

    serializeValues (values) {
        switch (this.valueType) {
            case 'json': return this.serializeJsonValues(values);
        }
        return values.join();
    }

    serializeJsonValues (values) {
        return values.length ? JSON.stringify(values) : '';
    }

    onUpdate () {
        if (this.updateItems()) {
            this.$list.html(this.build());
            Jam.Helper.bindLabelsToInputs(this.$list);
            this.setValue(this.getValue());
            this.enable(!this.isDisabled());
        }
    }

    updateItems () {
        const items = Jam.EnumSet.filterItems(this.sets);
        if (!Jam.ArrayHelper.equals(items, this.items)) {
            this.items = items;
        }
        return this.items === items;
    }

    build () {
        let template = Jam.Helper.getTemplate('checkbox', this.$attr);
        let category = this.getData('t-sets');
        let result = '';
        for (let {value, text, hint} of this.items) {
            value = Jam.escape(value);
            text = Jam.escape(Jam.t(text, category));
            hint = Jam.escape(Jam.t(hint, category));
            result += Jam.Helper.resolveTemplate(template, {value, text, hint});
        }
        return result;
    }
};