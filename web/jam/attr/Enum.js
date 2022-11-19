/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
Jam.EnumModelAttr = class EnumModelAttr extends Jam.ModelAttr {

    init () {
        this.sets = Jam.EnumSet.createSets(this.getData('sets'), this);
        this.select2Params = this.getData('select2');
        this.$select = this.find('select');
        this.$select.change(this.changeValue.bind(this));
        this.model.events.on('change', this.onUpdate.bind(this));
        setTimeout(this.onUpdate.bind(this), 0);
        super.init();
    }

    activate () {
        if (this.canActivate()) {
            if (this.select2Params) {
                this.$select.select2(this.select2Params);
            }
            this.activated = true;
        }
    }

    enable (state) {
        super.enable(state);
        this.$select.attr('disabled', !state);
    }

    setValue (value) {
        this.$value.val(value);
        this.$select.val(value).trigger('change.select2');
    }

    changeValue () {
        if (this.$value.val() !== this.$select.val()) {
            this.$value.val(this.$select.val());
            this.triggerChange();
        }
        this.toggleBlank();
    }

    onUpdate () {
        if (this.updateItems()) {
            const value = this.getValue();
            this.$select.html(this.build());
            this.$select.val(value);
            if (value !== this.$select.val()) {
                this.$value.val('');
                this.$select.val(null);
                this.triggerChange();
            }
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
        let category = this.getData('t-sets');
        let result = '<option value></option>';
        for (let {value, text, hint} of this.items) {
            value = Jam.escape(value);
            text = Jam.escape(Jam.t(text, category));
            hint = Jam.escape(Jam.t(hint, category)) || '';
            result += `<option value="${value}" title="${hint}">${text}</option>`;
        }
        return result;
    }
};