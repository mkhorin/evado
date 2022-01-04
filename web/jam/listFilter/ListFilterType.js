/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
Jam.ListFilterType = class ListFilterType {

    constructor (params, condition) {
        this.condition = condition;
        this.filter = condition.filter;
        this.name = params.type;
        this.params = {
            ...this.filter.getTypeParams(this.name),
            ...params
        };
        this.init();
    }

    init () {
        this.append();
    }

    getSelect2 () {
        return this.getValueElement().data('select2');
    }

    getValue () {
        return $.trim(this.getValueElement().val());
    }

    setValue (value) {
        return this.getValueElement().val(value);
    }

    changeValue (value) {
        return this.setValue(value);
    }

    getValueElement () {
        return this.condition.getValueElement();
    }

    append () {
        this.$container = $(this.filter.$typeSamples.children(`[data-id="${this.name}"]`).html());
        this.condition.$attrContainer.after(this.$container);
    }

    focus () {
        this.condition.$container.find('.default-focus').focus();
    }

    delete () {
        this.condition.$attrContainer.nextAll().remove();
    }

    serialize (data) {
        return Object.assign(data, {
            type: this.name,
            inline: this.params.inline,
            valueType: this.params.valueType
        });
    }
};