/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
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
        this.initial = true;
        this.update();
        this.initial = false;
    }

    update () {
        const value = this.model.stringifyAttrs();
        for (const element of this.elements) {
            element.update();
        }
        value === this.model.stringifyAttrs()
            ? this.events.trigger('update')
            : this.model.events.trigger('change');
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
            const action = this.createAction(id, this.data[id]);
            if (action) {
                this.actions[id] = action;
            } else {
                console.error(`${this.constructor.name}: Invalid action: ${id}`);
            }
        }
    }

    createAction (id, data) {
        switch (id) {
            case 'show': return new Jam.ActionBinderShow(this, data);
            case 'require': return new Jam.ActionBinderRequire(this, data);
            case 'enable': return new Jam.ActionBinderEnable(this, data);
            case 'value': return new Jam.ActionBinderValue(this, data);
        }
    }

    update () {
        for (const action of Object.values(this.actions)) {
            action.update();
        }
    }
};

Jam.ActionBinderAction = class ActionBinderAction {

    constructor (element, data) {
        this.element = element;
        this.attr = this.element.attr;
        this.$item = this.element.$item;
        this.data = data;
        this.init();
    }

    init () {
        this.condition = new Jam.ModelCondition(this.data, this.element.binder.model);
    }

    isValid () {
        this.condition.initial = this.element.binder.initial;
        return this.condition.isValid();
    }

    update () {
        this.isValid() ? this.setValid() : this.setInvalid();
    }
};

Jam.ActionBinderShow = class ActionBinderShow extends Jam.ActionBinderAction {

    update () {
        const visible = this.isValid();
        const group = this.$item.data('group');
        if (group) {
            group.toggle(visible);
        } else if (this.attr) {
            this.attr.toggle(visible);
        } else {
            this.$item.toggleClass('hidden', !visible);
        }
    }
};

Jam.ActionBinderRequire = class ActionBinderRequire extends Jam.ActionBinderAction {

    update () {
        const valid = this.isValid();
        if (this.attr) {
            this.attr.require(valid)
        } else {
            this.$item.toggleClass('required', valid);
        }
    }
};

Jam.ActionBinderEnable = class ActionBinderEnabled extends Jam.ActionBinderAction {

    update () {
        const valid = this.isValid();
        if (this.attr) {
            this.attr.enable(valid)
        } else {
            this.$item.toggleClass('disabled', !this.isValid());
        }
    }
};

/**
 * [value, condition]
 * [[value1, condition], [value2, condition], ...]
 * [.attrName, condition} - value from attribute
 * [.attrName.methodName, condition} - value from attribute by method
 */
Jam.ActionBinderValue = class ActionBinderValue extends Jam.ActionBinderAction {

    init () {
        if (!this.attr) {
            return console.error(`${this.constructor.name}: Invalid model attribute`);
        }
        this.createItems(this.data);
    }

    createItems (data) {
        this.items = [];
        if (Array.isArray(data[0])) {
            for (const item of data) {
                this.items.push(this.createItem(item));
            }
        } else {
            this.items.push(this.createItem(data));
        }
    }

    createItem ([value, condition]) {
        const result = {value};
        if (typeof value === 'string') {
            const items = value.split('.');
            if (items[1] && items[0] === '') {
                result.attrName = items[1];
                result.method = items[2];
            }
        }
        result.condition = new Jam.ModelCondition(condition, this.element.binder.model);
        return result;
    }

    parseAttrValue () {
    }

    getValidItem () {
        for (const item of this.items) {
            if (item.condition.isValid()) {
                return item;
            }
        }
    }

    getItemValue ({value, attrName, method}) {
        if (!attrName) {
            return value;
        }
        const attr = this.element.binder.model.getAttr(attrName);
        if (attr) {
            return method ? attr[method]() : attr.getValue();
        }
        console.error(`${this.constructor.name}: Attribute not found: ${attrName}`);
    }

    update () {
        if (!this.attr) {
            return false;
        }
        const item = this.getValidItem();
        if (item) {
            this.attr.setValue(this.getItemValue(item));
        }
    }
};