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
        return $container.find('.form-attr').map((index, element) => $(element).data('modelAttr')).get();
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

    toggle (visible) {
        this.$attr.toggleClass('hidden', !visible);
        if (!visible && !this.isReadOnly()) {
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
        this.getDependencyNames().forEach(this.bindDependencyChangeByName, this);
    }

    bindDependencyChangeByName (name) {
        this.model.getAttr(name)?.$value.change(this.onDependencyChange.bind(this));
    }

    onDependencyChange () {
        this.clear();
    }
};