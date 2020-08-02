/**
 * @copyright Copyright (c) 2020 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const Base = require('./BaseModelConsole');

module.exports = class UserFilterConsole extends Base {

    constructor (config) {
        super({
            key: 'userFilters',
            ...config
        })
    }

    async createModel (name, data) {
        const model = this.spawn('notifier/UserFilter');
        model.assign(data);
        model.set('name', name);
        model.set('config', data.config ? JSON.stringify(data.config) : '');
        model.set('includes', await this.owner.resolveUsers(data.includes));
        model.set('excludes', await this.owner.resolveUsers(data.excludes));
        model.set('items', await this.resolveItems(data.items));
        await this.saveModel(model, name);
    }

    resolveItems (names) {
        names = Array.isArray(names) ? names : [];
        return names.length
            ? this.module.getRbac().store.findItem().and({name: names}).ids()
            : names;
    }
};