/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
Jam.EnumSet = class EnumSet {

    static createSets (data, owner) {
        const sets = [];
        if (Array.isArray(data)) {
            for (const item of data) {
                const enumSet = new this(item, owner);
                sets.push(enumSet);
            }
        }
        return sets;
    }

    static filterItems (sets) {
        const items = [];
        for (const set of sets) {
            if (set.isActive()) {
                items.push(...set.items);
            }
        }
        const result = Jam.ArrayHelper.uniqueByKey('value', items);
        return result.sort((a, b)=> a.orderNumber - b.orderNumber);
    }

    constructor ({items, condition}, owner) {
        this.owner = owner;
        this.items = this.parseItems(items);
        if (condition) {
            this.condition = new Jam.ModelCondition(condition, this.owner.model);
        }
    }

    isActive () {
        return !this.condition || this.condition.isValid();
    }

    parseItems (items) {
        const result = [];
        for (const item of items) {
            result.push(Array.isArray(item)
                ? this.parseArrayItem(item)
                : this.parseDataItem(item));
        }
        return result;
    }

    parseArrayItem ([value, text, hint]) {
        return {value, text, hint};
    }

    parseDataItem (data) {
        return data;
    }
};