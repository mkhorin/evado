/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 *
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
            const value = this.getItemValue(item);
            this.attr.setValue(value);
        }
    }
};