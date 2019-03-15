'use strict';

Ant.ModelAttr = class {

    static create ($attr, model) {
        let type = $attr.data('type');
        let map = this.getClassMap();
        let Class = map.hasOwnProperty(type) ? map[type] : this;
        return new Class($attr, model);
    }

    static getClassMap () {
        return {
            'ajaxSelect': Ant.ModelAttr.AjaxSelect,
            'checkbox': Ant.ModelAttr.Checkbox,
            'checkboxList': Ant.ModelAttr.CheckboxList,
            'date': Ant.ModelAttr.Date,
            'json': Ant.ModelAttr.Json,
            'radioList': Ant.ModelAttr.RadioList,
            'radioSelection': Ant.ModelAttr.RadioSelection,
            'relation': Ant.ModelAttr.Relation,
            'relationSelect': Ant.ModelAttr.RelationSelect,
            'select': Ant.ModelAttr.Select,
            'selection': Ant.ModelAttr.Selection,
            'valueMap': Ant.ModelAttr.ValueMap,
            'file': Ant.ModelAttr.File
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
        this.init();
        this.initHandler();
        this.activate();
    }

    init () {}

    initHandler () {
        let data = this.$attr.data('handler');
        if (data && data.type) {
            let name = `handler${data.type}`;
            if (typeof this[name] === 'function') {
                this[name].call(this, data);
            }
        }
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
        this.$value.attr('disabled', !state);
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

Ant.ModelAttr.Checkbox = class extends Ant.ModelAttr {

    init () {
        super.init();
        this.trueValue = this.$attr.data('true') || 'on';
        this.falseValue = this.$attr.data('false') || '';
        this.$checkbox = this.$attr.find('[type="checkbox"]');
        this.$checkbox.change(this.onChangeCheckbox.bind(this));
    }

    enable (state) {
        this.$value.attr('disabled', !state);
        this.$checkbox.attr('disabled', !state);
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

Ant.ModelAttr.CheckboxList = class extends Ant.ModelAttr {

    init () {
        super.init();
        this.$itemList = this.$attr.find('[type="checkbox"]');
        this.setValue(this.$value.val());
        this.$itemList.change(this.onChangeCheckbox.bind(this));
    }

    enable (state) {
        this.$value.attr('disabled', !state);
        this.$itemList.attr('disabled', !state);
    }

    setValue (value) {
        this.$value.val(value);
        this.$itemList.prop('checked', false);
        value = value instanceof Array ? value : typeof value === 'string' ? value.split(',') : [];
        for (let val of value) {
            this.$itemList.filter(`[value="${val}"]`).prop('checked', true);
        }
    }

    extractValues () {
        let values = [];
        this.$itemList.filter(':checked').each((index, element)=> {
           values.push($(element).val());
        });
        return values;
    }

    onChangeCheckbox (event) {
        this.$value.val(this.extractValues()).change();
    }
};

Ant.ModelAttr.Date = class extends Ant.ModelAttr {

    init () {
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
        this.$value.val(date ? Ant.DateHelper.stringify(date, this.utc) : '').change();
        if (!date) {
            this.picker.hide();
        }
    }
};

Ant.ModelAttr.RadioList = class extends Ant.ModelAttr {

    init () {
        super.init();
        this.$itemList = this.$attr.find('[type="radio"]');
        this.setValue(this.$value.val());
        this.$itemList.change(this.changeValue.bind(this));
    }

    enable (state) {
        this.$value.attr('disabled', !state);
        this.$itemList.attr('disabled', !state);
    }

    changeValue (event) {
        if (event.target.checked) {
            this.$itemList.not(event.target).prop('checked', false);
            this.$value.val($(event.target).val()).change();
        }
    }

    setValue (value) {
        this.$value.val(value);
        this.$itemList.prop('checked', false);
        this.$itemList.filter(`[value="${value}"]`).prop('checked', true);
    }
};

Ant.ModelAttr.Select = class extends Ant.ModelAttr {

    init () {
        super.init();
        this.select2 = this.$attr.data('select2');
        this.url = this.$attr.data('url');
        this.$attr.find('[data-action="url"]').click(this.onUrl.bind(this));
    }

    activate () {
        if (this.canActivate()) {
            if (this.select2) {
                this.$value.select2(this.select2);
            }
            this.activated = true;
        }
    }

    onUrl () {
        this.hasValue() && this.loadModal();
    }

    loadModal () {
        this.childModal = this.childModal || Ant.modal.create();
        this.childModal.load(this.url, {'id': this.getValue()}, ()=> {
            this.childModal.one('afterClose', this.afterClose.bind(this));
        });
    }

    afterClose (event, data) {
        if (data && data.reopen) {
            this.loadModal();
        }
    }
};