/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
Jam.Behavior = class Behavior {

    static createAll (items, owner, params) {
        if (Array.isArray(items)) {
            for (const item of items) {
                this.create(item, owner, params);
            }
        }
    }

    static create (data, owner, params) {
        const Class = Jam.getClass(data);
        params = data.name ? Object.assign(data, params) : params;
        return new Class(owner, params);
    }

    constructor (owner, params) {
        this.owner = owner;
        this.params = Object.assign(this.getDefaultParams(), params);
    }

    getDefaultParams () {
        return {};
    }
};