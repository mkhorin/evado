/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
Jam.ModelAttr = class ModelAttr {

    static createAll ($container, model) {
        const attrs = [];
        for (let attr of $container.find('.form-attr')) {
            attr = Jam.ModelAttr.create($(attr), model);
            if (attr) {
                attrs.push(attr);
            }
        }
        for (const attr of attrs) {
            attr.init();
        }
        return attrs;
    }

    static create ($attr, model) {
        const name = $attr.data('handler');
        const config = name
            ? Jam.ClassHelper.normalizeSpawn(`${name}ModelAttr`, this)
            : null;
        return config
            ? new config.Class($attr, model, config)
            : new this($attr, model);
    }

    static getSpawnByType (type) {
        const data = this.getClassMap();
        return Jam.ObjectHelper.has(type, data) ? {Class: data[type]} : null;
    }

    static get ($elem) {
        return $elem.closest('.form-attr').data('modelAttr');
    }

    static getAttrs ($container) {
        return $container
            .find('.form-attr')
            .map((index, element) => $(element).data('modelAttr'))
            .get();
    }

    constructor ($attr, model) {
        this.$attr = $attr;
        this.model = model;
        this.$value = model.findAttrValue(this.$attr);
        this.$attr.data('modelAttr', this);
        this.params = Object.assign(this.getDefaultParams(), this.getData('params'));
        this.initialValue = this.getValue();
    }

    getDefaultParams () {
        return {};
    }

    init () {
        this.activate();
        this.toggleBlank();
        this.createMask();
        this.formatDisplayValue();
        Jam.Behavior.createAll(this.getData('behaviors'), this);
    }

    createMask () {
        this.mask = new Jam.ValueMask(this.getData('mask'), this.$value);
    }

    formatDisplayValue () {
        Jam.FormatHelper.formatDisplayValue(this.getValue(), this.$attr);
    }

    isRunning () {
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

    enable (enabled) {
        const disabled = !enabled;
        if (disabled) {
            this.setInitialValue();
        }
        this.$value.attr('readonly', disabled);
        this.$value.toggleClass('disabled', disabled);
        this.$attr.toggleClass('disabled', disabled);
    }

    require (state) {
        this.$attr.toggleClass('required', state);
        state ? this.$value.attr('required', true)
              : this.$value.removeAttr('required');
    }

    toggle (visible) {
        const hidden = !visible;
        this.$attr.toggleClass('hidden', hidden);
        if (hidden && !this.isReadOnly()) {
            this.setInitialValue();
        }
        this.activate();
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
        const names = this.params.depends;
        return Array.isArray(names) ? names : names ? [names] : [];
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

    addChangeListener () {
        this.$value.on('change', ...arguments);
    }

    triggerChange () {
        this.$value.trigger('change', ...arguments);
    }

    toggleBlank () {
        this.$attr.toggleClass('blank', !this.hasValue());
    }

    find () {
        return this.$attr.find(...arguments);
    }

    findByData (key, value) {
        const selector = value === undefined
            ? `[data-${key}="${value}"]`
            : `[data-${key}]`;
        return this.find(selector);
    }

    serialize () {
        return this.getValue();
    }

    bindDependencyChange () {
        this.getDependencyNames().forEach(this.bindDependencyChangeByName, this);
    }

    bindDependencyChangeByName (name) {
        const attr = this.model.getAttr(name);
        attr?.addChangeListener(this.onDependencyChange.bind(this));
    }

    onDependencyChange () {
        this.clear();
    }
};