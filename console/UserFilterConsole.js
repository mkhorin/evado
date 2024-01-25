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
        const config = this.owner.stringifyData(data.config);
        const includes = await this.owner.resolveUsers(data.includes);
        const excludes = await this.owner.resolveUsers(data.excludes);
        const items = await this.resolveItems(data.items);
        model.assign(data);
        model.set('name', name);
        model.set('config', config);
        model.set('includes', includes);
        model.set('excludes', excludes);
        model.set('items', items);
        await this.saveModel(model, name);
    }

    async resolveItems (names) {
        const result = [];
        const {store} = this.module.getRbac();
        for (const name of StringHelper.split(names)) {
            const query = store.findItem().and({name});
            const item = await query.id();
            item ? result.push(item)
                 : this.log('error', `Item not found: ${name}`);
        }
        return result;
    }
};

const StringHelper = require('areto/helper/StringHelper');