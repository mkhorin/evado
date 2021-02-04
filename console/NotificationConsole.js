/**
 * @copyright Copyright (c) 2020 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const Base = require('./BaseModelConsole');

module.exports = class NotificationConsole extends Base {

    constructor (config) {
        super({
            key: 'notifications',
            ...config
        })
    }

    async createModel (name, data) {
        const model = this.spawn('notifier/Notification');
        model.assign(data);
        model.set('name', name);
        model.set('messageTemplate', this.owner.stringifyData(data.messageTemplate));
        model.set('options', this.owner.stringifyData(data.options));
        model.set('recipient', this.owner.stringifyData(data.recipient));
        model.set('users', await this.owner.resolveUsers(data.users));
        model.set('userFilters', await this.resolveUserFilters(data.userFilters));
        await this.saveModel(model, name);
    }

    async resolveUserFilters (names) {
        const result = [];
        const model = this.spawn('model/UserFilter');
        for (const name of StringHelper.split(names)) {
            const item = await model.find({name}).id();
            item ? result.push(item)
                 : this.log('error', `User filter not found: ${name}`);
        }
        return result;
    }
};

const StringHelper = require('areto/helper/StringHelper');