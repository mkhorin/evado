/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
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
};