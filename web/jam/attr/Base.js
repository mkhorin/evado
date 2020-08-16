/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

Jam.ModelAttr = class ModelAttr {

    static create ($attr, model) {
        const name = $attr.data('handler');
        if (!name) {
            return new this($attr, model);
        }
        const config = Jam.ClassHelper.normalizeSpawn(`${name}ModelAttr`, this);
        return new config.Class($attr, model, config);
    }

    static getSpawnByType (type) {
        const data = this.getClassMap();
        return Jam.ObjectHelper.has(type, data) ? {Class: data[type]} : null;
    }

    static get ($elem) {
        return $elem.closest('.form-attr').data('model-attr');
    }

    static getAttrs ($container) {
        return $container.find('.form-attr').map((index, element) => $(element).data('model-attr')).get();
    }

    constructor ($attr, model) {
        this.$attr = $attr;
        this.model = model;
        this.$value = model.findAttrValue(this.$attr);
        this.$attr.data('model-attr', this);
        this.params = this.getData('params') || {};
        this.initialValue = this.getValue();
    }

    init () {
        this.activate();
        this.toggleBlank();
        Jam.Behavior.createAll(this.getData('behaviors'), this);
    }

    inProgress () {
        return false;
    }

    isDisabled () {
        return this.$attr.hasClass('disabled');
    }

    isReadOnly () {
        return !!this.$value.attr('readonly');
    }

    isRequired () {
        return this.$attr.hasClass('required');
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

    require (state) {
        this.$attr.toggleClass('required', state);
        state ? this.$value.attr('required', true)
              : this.$value.removeAttr('required');
    }

    clear () {
        this.setValue('');
    }

    getName () {
        return this.$value.attr('name');
    }

    getData (name) {
        return this.$attr.data(name);
    }

    getType () {
        return this.getData('type');
    }

    getDependencyNames () {
        return this.params.depends;
    }

    getDependencyValue () {
        return this.getValue();
    }

    hasValue () {
        const value = this.getValue();
        return value !== '' && value !== null && value !== undefined;
    }

    getLinkedValue () {
        return this.getValue();
    }

    getValue () {
        return this.$value.val();
    }

    setValue (value) {
        this.$value.val(value);
    }

    setInitialValue () {
        this.setValue(this.initialValue);
    }

    triggerChange () {
        this.$value.change();
    }

    toggleBlank () {
        this.$attr.toggleClass('blank', !this.hasValue());
    }

    find () {
        return this.$attr.find(...arguments);
    }

    findByData (key, value) {
        return this.find(value === undefined ? `[data-${key}="${value}"]` : `[data-${key}]`);
    }

    serialize () {
        return this.getValue();
    }

    bindDependencyChange () {
        const names = this.getDependencyNames();
        if (Array.isArray(names)) {
            for (const name of names) {
                const attr = this.model.getAttr(name);
                if (attr) {
                    attr.$value.change(this.onDependencyChange.bind(this));
                }
            }
        }
    }

    onDependencyChange () {
        this.clear();
    }
};

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

Jam.DateModelAttr = class DateModelAttr extends Jam.ModelAttr {

    constructor () {
        super(...arguments);
        this.utc = this.getData('utc');
    }

    activate () {
        this.$picker = this.find('.datepicker');
        if (this.$picker.length) {
            this.createPicker();
        }
        this.activated = true;
    }

    createPicker () {
        try {
            const options = this.params.datepicker || {};
            if (options.minDate) {
                options.minDate = new Date(options.minDate);
            }
            if (options.maxDate) {
                options.maxDate = new Date(options.maxDate);
            }
            options.defaultDate = this.getDefaultDate(this.$value.val());
            options.format = this.getFormat(options);
            options.widgetParent = this.$picker.parent();
            this.$picker.datetimepicker({...$.fn.datetimepicker.defaultOptions, ...options});
            this.picker = this.$picker.data('DateTimePicker');
            this.$picker.on('dp.change', this.onChangeDate.bind(this));
        } catch (err) {
            console.error(err);
        }
    }

    getDefaultDate (value) {
        return !value ? null : this.utc ? new Date(value.slice(0, -1)) : new Date(value);
    }

    getFormat (options) {
        const format = this.params.momentFormat;
        return format || Jam.DateHelper.getMomentFormat(options.format || this.params.format || 'date');
    }

    onChangeDate (event) {
        const date = event.date;
        const format = this.picker.options().format;
        // if date format then remove time
        const value = date ? moment(moment(date).format(format), format) : '';
        this.$value.val(value ? Jam.DateHelper.stringify(value, this.utc) : '');
        this.triggerChange();
        if (!date) {
            this.picker.hide();
        }
    }

    setValue (value) {
        value ? this.picker.date(moment(value)) : this.picker.clear();
    }
};

Jam.TimeModelAttr = class TimeModelAttr extends Jam.DateModelAttr {

    constructor () {
        super(...arguments);
        this.utc = false;
    }

    getDefaultDate (value) {
        return this.getDateByTime(value);
    }

    getFormat () {
        return this.params.momentFormat || 'LT';
    }

    onChangeDate (event) {
        const date = event.date;
        const format = 'HH:mm:ss';
        const value = date ? moment.duration(moment(date).format(format), format).asSeconds() : '';
        this.$value.val(value);
        this.triggerChange();
    }

    setValue (value) {
        super.setValue(this.getDateByTime(value));
    }

    getDateByTime (seconds) {
        seconds = parseInt(seconds);
        return isNaN(seconds) ? null : moment().startOf('day').add(moment.duration({s: seconds})).toDate();
    }
};

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

// BEHAVIORS

Jam.StoreLastSavedValueBehavior = class StoreLastSavedValueBehavior extends Jam.Behavior {

    constructor () {
        super(...arguments);
        this.model = this.owner.model;
        this.defaultValue = this.owner.getValue();
        this.owner.find('[data-value]').click(this.onValue.bind(this));
        this.setStoreValue();
        this.model.events.one('afterSave', this.onSaveModel.bind(this));
    }

    getStoreKey () {
        return this.model.params.url + this.owner.getName();
    }

    onDefaultValue () {
        this.owner.setValue(this.defaultValue);
    }

    onValue (event) {
        this.owner.setValue(event.currentTarget.dataset.value);
    }

    onSaveModel () {
        Jam.store.set(this.getStoreKey(), this.owner.getValue());
    }

    setStoreValue () {
        const value = Jam.store.get(this.getStoreKey());
        if (value) {
            this.owner.setValue(value);
        }
    }
};