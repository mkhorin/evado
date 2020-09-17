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
        const model = this.spawn('model/UserFilter');
        model.assign(data);
        model.set('name', name);
        model.set('config', this.owner.stringifyData(data.config));
        model.set('includes', await this.owner.resolveUsers(data.includes));
        model.set('excludes', await this.owner.resolveUsers(data.excludes));
        model.set('items', await this.resolveItems(data.items));
        await this.saveModel(model, name);
    }

    async resolveItems (names) {
        const result = [];
        const store = this.module.getRbac().store;
        for (const name of StringHelper.split(names)) {
            const item = await store.findItem().and({name}).id();
            item ? result.push(item)
                 : this.log('error', `Item not found: ${name}`);
        }
        return result;
    }
};

const StringHelper = require('areto/helper/StringHelper');