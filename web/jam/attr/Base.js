/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

Jam.ModelAttr = class {

    static create ($attr, model) {
        let type = $attr.data('type');
        let map = this.getClassMap();
        let Class = map.hasOwnProperty(type) ? map[type] : this;
        return new Class($attr, model);
    }

    static getClassMap () {
        return {
            'checkbox': Jam.ModelAttr.Checkbox,
            'checkboxList': Jam.ModelAttr.CheckboxList,
            'date': Jam.ModelAttr.Date,
            'json': Jam.ModelAttr.Json,
            'radioList': Jam.ModelAttr.RadioList,
            'radioSelection': Jam.ModelAttr.RadioSelection,
            'relation': Jam.ModelAttr.Relation,
            'relationSelect': Jam.ModelAttr.RelationSelect,
            'select': Jam.ModelAttr.Select,
            'selection': Jam.ModelAttr.Selection,
            'valueMap': Jam.ModelAttr.ValueMap,
            'file': Jam.ModelAttr.File
        };
    }

    static get ($elem) {
        return $elem.closest('.form-attr').data('model-attr');
    }

    static getAttrs ($container) {
        return $container.find('.form-attr').map((index, element)=> $(element).data('model-attr')).get();
    }

    constructor ($attr, model) {
        this.$attr = $attr;
        this.model = model;
        this.$value = model.getValueFieldByAttr(this.$attr);
        this.$attr.data('model-attr', this);
        this.type = $attr.data('type');
        this.params = this.$attr.data('params') || {};
    }

    init () {
        this.initHandler();
        this.activate();
    }

    initHandler () {
        let data = this.$attr.data('handler');
        if (data && data.type) {
            let name = `handler${data.type}`;
            if (typeof this[name] === 'function') {
                this[name].call(this, data);
            }
        }
    }

    inProgress () {
        return false;
    }

    isDisabled () {
        return this.$attr.hasClass('disabled');
    }

    isVisible () {
        return !this.$attr.hasClass('hidden');
    }

    canActivate () {
        return !this.activated && this.$attr.is(':visible');
    }

    activate () {
        this.activated = true;
    }

    enable (state) {
        this.$value.attr('readonly', !state);
        this.$value.toggleClass('disabled', !state);
        this.$attr.toggleClass('disabled', !state);
    }

    getType () {
        return this.$attr.data('type');
    }

    hasValue () {
        let value = this.getValue();
        return value !== '' && value !== null && value !== undefined;
    }

    getValue () {
        return this.$value.val();
    }

    setValue (value) {
        this.$value.val(value);
    }

    normalizeValue (value) {
        return value;
    }

    findByData (key, value) {
        return this.$attr.find(value === undefined ? `[data-${key}="${value}"]` : `[data-${key}]`);
    }

    handlerStoreLastValueToBrowser () {
        let name = this.$value.attr('name');
        this.$value.val(store.get(name));
        this.model.modal.on('beforeClose', this.onBeforeCloseModal.bind(this));
    }

    onBeforeCloseModal (event) {
        if (this.model.saved) {
            store.set(name, this.$value.val());
        }
    }
};

Jam.ModelAttr.Checkbox = class extends Jam.ModelAttr {

    constructor () {
        super(...arguments);
        this.trueValue = this.$attr.data('true') || 'on';
        this.falseValue = this.$attr.data('false') || '';
        this.$checkbox = this.$attr.find('[type="checkbox"]');
        this.$checkbox.change(this.onChangeCheckbox.bind(this));
    }

    enable (state) {
        this.$value.attr('readonly', !state);
        this.$checkbox.attr('readonly', !state);
        this.$value.closest('.checkbox').toggleClass('disabled', !state);
    }

    setValue (value) {
        this.$value.val(value ? 'on' : '');
        this.$checkbox.prop('checked', value);
    }

    onChangeCheckbox (event) {
        this.$value.val(event.target.checked ? this.trueValue : this.falseValue);
        this.$value.change();
    }
};

Jam.ModelAttr.CheckboxList = class extends Jam.ModelAttr {

    constructor () {
        super(...arguments);
        this.$itemList = this.$attr.find('[type="checkbox"]');
        this.$itemList.change(this.onChangeCheckbox.bind(this));
        this.setValue(this.$value.val());
    }

    enable (state) {
        this.$value.attr('readonly', !state);
        this.$itemList.attr('readonly', !state);
    }

    setValue (value) {
        this.$value.val(value);
        this.$itemList.prop('checked', false);
        value = Array.isArray(value) ? value : typeof value === 'string' ? value.split(',') : [];
        for (let val of value) {
            this.$itemList.filter(`[value="${val}"]`).prop('checked', true);
        }
    }

    extractValues () {
        let values = [];
        for (let item of this.$itemList.filter(':checked')) {
            values.push($(item).val());
        }
        return values;
    }

    onChangeCheckbox (event) {
        this.$value.val(this.extractValues()).change();
    }
};

Jam.ModelAttr.Date = class extends Jam.ModelAttr {

    constructor () {
        super(...arguments);
        this.utc = this.$attr.data('utc');
    }

    activate () {
        this.$picker = this.$attr.find('.datepicker');
        if (this.$picker.length) {
            this.createPicker();
        }
        this.activated = true;
    }

    createPicker () {
        let options = this.params.datepicker || {};
        if (options.minDate) {
            options.minDate = new Date(options.minDate);
        }
        if (options.maxDate) {
            options.maxDate = new Date(options.maxDate);
        }
        options.defaultDate = this.getDefaultDate(this.$value.val());
        options.format = options.format || this.params.format || 'L';
        options.widgetParent = this.$picker.parent();
        this.$picker.datetimepicker({...$.fn.datetimepicker.defaultOptions, ...options});
        this.picker = this.$picker.data('DateTimePicker');
        this.$picker.on('dp.change', this.onChangeDate.bind(this));
    }

    getDefaultDate (value) {
        return !value ? null : this.utc ? new Date(value.slice(0, -1)) : new Date(value);
    }

    onChangeDate (event) {
        let date = event.date;
        let format = this.picker.options().format;
        // reformat date to remove time on select day only
        date = date && moment(moment(date).format(format), format);
        this.$value.val(date ? Jam.DateHelper.stringify(date, this.utc) : '').change();
        if (!date) {
            this.picker.hide();
        }
    }
};

Jam.ModelAttr.RadioList = class extends Jam.ModelAttr {

    constructor () {
        super(...arguments);
        this.$itemList = this.$attr.find('[type="radio"]');
        this.$itemList.change(this.onChangeValue.bind(this));
        this.setValue(this.$value.val());
    }

    enable (state) {
        this.$value.attr('readonly', !state);
        this.$itemList.attr('readonly', !state);
    }

        setValue (value) {
        this.$value.val(value);
        this.$itemList.prop('checked', false);
        this.$itemList.filter(`[value="${value}"]`).prop('checked', true);
    }

    onChangeValue (event) {
        if (event.target.checked) {
            this.$itemList.not(event.target).prop('checked', false);
            this.$value.val($(event.target).val()).change();
        }
    }
};