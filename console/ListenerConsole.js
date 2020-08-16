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
        model.set('handlers', await this.getRelatedIds('observer/EventHandler', data.handlers));
        model.set('notices', await this.getRelatedIds('notifier/Notice', data.notices));
        model.set('tasks', await this.getRelatedIds('model/Task', data.tasks));
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
                id ? result.push(id)
                   : this.log('error', `Not found: ${modelName}: ${name}`);
            }
        }
        return result;
    }
};