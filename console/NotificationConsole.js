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
        const template = this.owner.stringifyData(data.messageTemplate);
        const options = this.owner.stringifyData(data.options);
        const recipients = this.owner.stringifyData(data.recipient);
        const users = await this.owner.resolveUsers(data.users);
        const filters = await this.resolveUserFilters(data.userFilters);
        model.assign(data);
        model.set('name', name);
        model.set('messageTemplate', template);
        model.set('options', options);
        model.set('recipient', recipients);
        model.set('users', users);
        model.set('userFilters', filters);
        await this.saveModel(model, name);
    }

    async resolveUserFilters (names) {
        const result = [];
        const model = this.spawn('model/UserFilter');
        for (const name of StringHelper.split(names)) {
            const id = await model.find({name}).id();
            if (id) {
                result.push(id);
            } else {
                this.log('error', `User filter not found: ${name}`);
            }
        }
        return result;
    }
};

const StringHelper = require('areto/helper/StringHelper');