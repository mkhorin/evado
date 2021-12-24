/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
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
        this.createActions();
    }

    createActions () {
        for (const id of Object.keys(this.data)) {
            this.actions[id] = this.createAction(id, this.data[id]);
            if (!this.actions[id]) {
                console.error(`${this.constructor.name}: Invalid action: ${id}`);
                delete this.actions[id];
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