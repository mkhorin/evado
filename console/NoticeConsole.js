/**
 * @copyright Copyright (c) 2020 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const Base = require('./BaseModelConsole');

module.exports = class NoticeConsole extends Base {

    constructor (config) {
        super({
            key: 'notices',
            ...config
        })
    }

    async createModel (name, data) {
        const model = this.spawn('notifier/Notice');
        model.assign(data);
        model.set('name', name);
        model.set('options', data.options ? JSON.stringify(data.options) : '');
        model.set('users', await this.owner.resolveUsers(data.users));
        model.set('userFilters', await this.resolveUserFilters(data.userFilters));
        await this.saveModel(model, name);
    }

    resolveUserFilters (names) {
        names = Array.isArray(names) ? names : [];
        return names.length
            ? this.spawn('notifier/UserFilter').find({name: names}).ids()
            : names;
    }
};