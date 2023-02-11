/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
Jam.Element = class Element {

    static createInstance ($element) {
        return this.getInstance($element) || Reflect.construct(this, arguments);
    }

    static getInstance ($element) {
        return $element.data(`jamInstance`);
    }

    static findInstanceByClass (instanceClass, $container) {
        const elements = $container.find('[data-jam]');
        for (const element of elements) {
            const instance = this.getInstance($(element));
            if (instance instanceof instanceClass) {
                return instance;
            }
        }
    }

    constructor ($element) {
        this.$element = $element;
        this.setInstance($element);
    }

    init () {
    }

    getData (key) {
        return this.$element.data(key);
    }

    find () {
        return this.$element.find(...arguments);
    }

    findData (key) {
        return this.find(`[data-${key}]`).data(key);
    }

    findInstanceByClass (instanceClass) {
        return this.constructor.findInstanceByClass(instanceClass, this.$element);
    }

    findInstanceByFrame (frame = this.frame) {
        return frame.findInstanceByClass(this.constructor);
    }

    setInstance ($element) {
        return $element.data('jamInstance', this);
    }

    resolveTemplate (name, data) {
        return Jam.Helper.findAndResolveTemplate(name, this.$element, data);
    }

    hasClass () {
        return this.$element.hasClass(...arguments);
    }

    addClass () {
        return this.$element.addClass(...arguments);
    }

    removeClass () {
        return this.$element.removeClass(...arguments);
    }

    toggleClass () {
        return this.$element.toggleClass(...arguments);
    }
};