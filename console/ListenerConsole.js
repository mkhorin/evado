/**
 * @copyright Copyright (c) 2020 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const Base = require('./BaseModelConsole');

module.exports = class ListenerConsole extends Base {

    constructor (config) {
        super({
            key: 'listeners',
            ...config
        })
    }

    async createModel (name, data) {
        const model = this.spawn('observer/Listener');
        model.assign({
            active: true,
            ...data
        });
        const handlers = await this.getRelatedIds('observer/EventHandler', data.handlers);
        const notifications = await this.getRelatedIds('notifier/Notification', data.notifications);
        const tasks = await this.getRelatedIds('model/Task', data.tasks);
        model.assign({handlers, notifications, tasks});
        await this.saveModel(model, name);
    }

    async getRelatedIds (modelName, names) {
        if (typeof names === 'string') {
            names = names.split(',');
        }
        const result = [];
        if (Array.isArray(names)) {
            const model = this.spawn(modelName);
            for (const name of names) {
                const id = await model.find({name}).id();
                if (id) {
                    result.push(id)
                } else {
                    this.log('error', `${modelName} not found: ${name}`);
                }
            }
        }
        return result;
    }
};