/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
Jam.ActionBinder = class ActionBinder {

    constructor (model) {
        this.model = model;
        this.events = new Jam.Events(this.constructor.name);
        this.init();
    }

    init () {
        this.elements = this.createElements(this.model.$form);
        this.model.events.on('change', this.onChange.bind(this));
        this.updateInitially();
    }

    createElements ($container) {
        const elements = [];
        for (const item of $container.find('[data-action-binder]')) {
            const element = this.createElement($(item));
            if (element) {
                elements.push(element);
            }
        }
        return elements;
    }

    createElement ($item) {
        const data = $item.data('actionBinder');
        if (data) {
            return new Jam.ActionBinderElement($item, data, this);
        }
    }

    appendElements ($container) {
        const elements = this.createElements($container);
        this.elements.push(...elements);
        this.updateInitially(elements);
    }

    onChange () {
        if (!this.running) {
            this.update();
        }
    }

    updateInitially () {
        this.initial = true;
        this.update(...arguments);
        this.initial = false;
    }

    update (elements = this.elements) {
        this.running = true;
        const value = this.model.stringifyAttrs();
        for (const element of elements) {
            element.update();
        }
        this.running = false;
        value === this.model.stringifyAttrs()
            ? this.events.trigger('update')
            : this.model.triggerChange();
    }
};