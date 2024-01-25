/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
Jam.ListFilterNested = class ListFilterNested {

    constructor (type) {
        this.type = type;
        this.condition = type.condition;
        this.filter = type.filter;
        this.params = type.params;
        this.resolve();
        this.condition.getOperationItem().change(this.onChangeOperation.bind(this));
        this.onChangeOperation();
    }

    active () {
        return this.condition.getOperation() === 'nested';
    }

    resolve () {
        const {columns} = this.params;
        if (!Array.isArray(columns) || !columns.length) {
            return this.condition.removeOperation('nested');
        }
        this.group = new Jam.ListFilterGroup(this.filter, columns);
        this.condition.$groupContainer.html(this.group.$container);
        this.$addCondition = this.condition.$content.find('.add-condition');
        this.$addCondition.click(this.onAddCondition.bind(this));
    }

    onChangeOperation () {
        this.toggle(this.active());
    }

    onAddCondition () {
        this.group.addCondition();
    }

    toggle (state) {
        this.condition.$container.toggleClass('has-nested', state);
    }

    getValue () {
        return this.group.serialize();
    }

    delete () {
        this.condition.$groupContainer.html('');
    }

    parse (items) {
        this.group.clear();
        for (const item of items) {
            this.group.addCondition().parse(item);
        }
    }
};