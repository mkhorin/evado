/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
Jam.RadioEnumModelAttr = class RadioEnumModelAttr extends Jam.ModelAttr {

    init () {
        super.init();
        this.sets = Jam.EnumSet.createSets(this.getData('sets'), this);
        this.$list = this.find('.form-check-list');
        this.$list.on('change', '[type="radio"]', this.changeValue.bind(this));
        this.model.events.on('change', this.onUpdate.bind(this));
        setTimeout(this.onUpdate.bind(this), 0);
    }

    getRadioItems () {
        return this.$list.find('[type="radio"]');
    }

    getRadioItem (value) {
        return this.getRadioItems().filter(`[value="${value}"]`);
    }

    enable (state) {
        this.$value.attr('disabled', !state);
        this.getRadioItems().attr('disabled', !state);
    }

    setValue (value) {
        this.$value.val(value);
        this.getRadioItems().prop('checked', false);
        this.getRadioItem(value).prop('checked', true);
    }

    changeValue (event) {
        const radio = event.currentTarget;
        if (radio.checked) {
            this.getRadioItems().not(radio).prop('checked', false);
            this.$value.val(radio.value).change();
        }
    }

    onUpdate () {
        if (this.updateItems()) {
            const value = this.getValue();
            this.$list.html(this.build());
            Jam.Helper.bindLabelsToInputs(this.$list);
            this.getRadioItem(value).length
                ? this.setValue(value)
                : this.$value.val('').change();
        }
    }

    updateItems () {
        const items = Jam.EnumSet.filterItems(this.sets);
        this.items = Jam.ArrayHelper.equals(items, this.items) ? this.items : items;
        return this.items === items;
    }

    build () {
        let template = Jam.Helper.getTemplate('radio', this.$attr);
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