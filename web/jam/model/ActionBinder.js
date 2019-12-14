/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

Jam.ActionBinder = class ActionBinder {

    constructor (model) {
        this.model = model;
        this.elements = [];
        this.events = new Jam.Events(this.constructor.name);
        this.init();
    }

    init () {
        for (const item of this.model.$form.find('[data-action-binder]')) {
            const $item = $(item);
            const data = $item.data('actionBinder');
            if (data) {
                this.elements.push(new Jam.ActionBinderElement($item, data, this));
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

Jam.ActionBinderElement = class ActionBinderElement {

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
                console.error(`Invalid action binder: ${id}`);
            }
        }
    }

    create (id, data) {
        switch (id) {
            case 'show': return new Jam.ActionBinderShow(this, data);
            case 'require': return new Jam.ActionBinderRequire(this, data);
            case 'enable': return new Jam.ActionBinderEnable(this, data);
            case 'value': return new Jam.ActionBinderValue(this, data);
        }
    }

    update () {
        for (const id of Object.keys(this.actions)) {
            this.actions[id].update();
        }
    }
};

Jam.ActionBinderBase = class ActionBinderBase {

    constructor (element, data) {
        this.element = element;
        this.attr = this.element.attr;
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

Jam.ActionBinderShow = class ActionBinderShow extends Jam.ActionBinderBase {

    update () {
        const visible = this.isValid();
        if (this.attr && !visible) {
            this.attr.clear();
        }
        const group = this.element.$item.data('group');
        group ? group.toggle(visible)
              : this.element.$item.toggleClass('hidden', !visible);
    }
};

Jam.ActionBinderRequire = class ActionBinderRequire extends Jam.ActionBinderBase {

    update () {
        //this.element.$item.toggleClass('hidden', !this.isValid());
    }
};

Jam.ActionBinderEnable = class ActionBinderEnabled extends Jam.ActionBinderBase {

    update () {
        this.attr
            ? this.attr.enable(this.isValid())
            : this.element.$item.toggleClass('disabled', !this.isValid());
    }
};

Jam.ActionBinderValue = class ActionBinderValue extends Jam.ActionBinderBase {

    init () {
        if (!this.attr) {
            return console.error('Action binder value without model attribute');
        }
        this.value = this.attr.normalizeValue(this.data[0]);
        this.condition = new Jam.ModelCondition(this.data[1], this.element.binder.model);
    }

    getValue () {
        return Array.isArray(this.value)
            ? this.element.binder.model.getAttr(this.value[0]).getValue()
            : this.value;
    }

    update () {
        if (this.attr && this.isValid()) {
            this.attr.setValue(this.getValue());
        }
    }
};