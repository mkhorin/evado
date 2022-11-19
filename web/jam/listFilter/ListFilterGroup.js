/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
Jam.ListFilterGroup = class ListFilterGroup {

    constructor (filter, columns) {
        this.filter = filter;
        this.columns = columns;
        this.events = new Jam.Events(this.constructor.name);
        this.$container = filter.$groupSample.clone().removeClass('hidden');
        this.conditions = [];
    }

    isEmpty () {
        return this.conditions.length === 0;
    }

    getAttrParams (name) {
        return Jam.ArrayHelper.getByNestedValue(name, 'name', this.columns);
    }

    getEmptyCondition () {
        const condition = this.conditions[this.conditions.length - 1];
        return condition && !condition.getAttr()
            ? condition
            : this.addCondition();
    }

    addCondition () {
        const condition = this.createCondition();
        this.conditions.push(condition);
        this.$container.append(condition.$container);
        return condition;
    }

    createCondition () {
        return new Jam.ListFilterCondition(this);
    }

    clear () {
        this.conditions = [];
        this.$container.empty();
    }

    serialize () {
        const items = this.conditions.map(item => item.serialize()).filter(v => v);
        if (items.length) {
            return items;
        }
    }

    afterDeleteCondition (condition) {
        Jam.ArrayHelper.remove(condition, this.conditions);
    }
};