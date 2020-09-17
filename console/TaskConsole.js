/**
 * @copyright Copyright (c) 2020 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const Base = require('./BaseModelConsole');

module.exports = class TaskConsole extends Base {

    constructor (config) {
        super({
            key: 'tasks',
            ...config
        })
    }

    async createModel (name, data) {
        const model = this.spawn('model/Task');
        model.assign(data);
        model.set('name', name);
        model.set('job', this.owner.stringifyData(data.job));
        await this.saveModel(model, name);
    }
};