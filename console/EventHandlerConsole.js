/**
 * @copyright Copyright (c) 2020 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const Base = require('./BaseModelConsole');

module.exports = class EventHandlerConsole extends Base {

    constructor (config) {
        super({
            key: 'eventHandlers',
            ...config
        })
    }

    async createModel (name, data) {
        const model = this.spawn('observer/EventHandler');
        model.set('name', name);
        model.set('label', data.label);
        model.set('description', data.description);
        model.set('config', this.owner.stringifyData(data.config));
        await this.saveModel(model, name);
    }
};