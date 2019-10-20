/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

Jam.ModelBinder = class ModelBinder {

    constructor (model) {
        this.model = model;
        this.elements = [];
        this.events = new Jam.Events('ModelBinder');
        this.init();
    }

    init () {
        for (const item of this.model.$form.find('[data-binder]')) {
            const $item = $(item);
            const data = $item.data('binder');
            if (data) {
                this.elements.push(new Jam.ModelBinderElement($item, data, this));
            }
        }
        this.model.events.on('change', this.update.bind(this));
        this.update();
    }

    update (event, target) {
        for (const element of this.elements) {
            element.update();
        }
        this.events.trigger('update');
    }
};

Jam.ModelBinderElement = class ModelBinderElement {

    constructor ($item, data, binder) {
        this.binder = binder;
        this.$item = $item;
        this.attr = Jam.ModelAttr.get($item);
        this.data = data || {};
        this.actions = {};
        this.init();
    }

    init () {
        for (const id of Object.keys(this.data)) {
            const action = this.create(id, this.data[id]);
            if (action) {
                this.actions[id] = action;
            } else {
                console.error(`Invalid binder action: ${id}`);
            }
        }
    }

    create (id, data) {
        switch (id) {
            case 'visible': return new Jam.ModelBinderVisible(this, data);
            case 'enabled': return new Jam.ModelBinderEnabled(this, data);
            case 'required': return new Jam.ModelBinderRequired(this, data);
            case 'value': return new Jam.ModelBinderValue(this, data);
        }
    }

    update () {
        for (const id of Object.keys(this.actions)) {
            this.actions[id].update();
        }
    }
};

Jam.ModelBinderAction = class ModelBinderAction {

    constructor (element, data) {
        this.element = element;
        this.data = data;
        this.init();
    }

    init () {
        this.condition = new Jam.ModelCondition(this.data, this.element.binder.model);
    }

    isValid () {
        return this.condition.isValid();
    }

    update () {
        this.isValid() ? this.setValid() : this.setInvalid();
    }
};

Jam.ModelBinderVisible = class ModelBinderVisible extends Jam.ModelBinderAction {

    update () {
        const group = this.element.$item.data('group');
        const visible = this.isValid();
        group ? group.toggle(visible)
              : this.element.$item.toggleClass('hidden', !visible);
    }
};

Jam.ModelBinderEnabled = class ModelBinderEnabled extends Jam.ModelBinderAction {

    update () {
        if (this.element.attr) {
            this.element.attr.enable(this.isValid());
        } else {
            this.element.$item.toggleClass('disabled', !this.isValid());
        }
    }
};

Jam.ModelBinderRequired = class extends Jam.ModelBinderAction {

    update () {
        //this.element.$item.toggleClass('hidden', !this.isValid());
    }
};

Jam.ModelBinderValue = class extends Jam.ModelBinderAction {

    init () {
        if (!this.element.attr) {
            return console.error('Binder value action without model attribute');
        }
        this.value = this.element.attr.normalizeValue(this.data[0]);
        this.condition = new Jam.ModelCondition(this.data[1], this.element.binder.model);
    }

    getValue () {
        return Array.isArray(this.value)
            ? this.element.binder.model.getAttr(this.value[0]).getValue()
            : this.value;
    }

    update () {
        if (this.element.attr && this.isValid()) {
            this.element.attr.setValue(this.getValue());
        }
    }
};