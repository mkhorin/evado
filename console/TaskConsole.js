/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const Base = require('areto/base/Base');

module.exports = class TaskConsole extends Base {

    async create () {
        await this.createModuleTasks(this.app);
        this.log('info', 'Tasks ready');
    }

    async createModuleTasks (module) {
        await this.createByData(module.getConfig('tasks'), module);
        for (const child of module.getModules()) {
            await this.createModuleTasks(child);
        }
    }

    async createByData (data, module) {
        if (data) {
            for (const name of Object.keys(data)) {
                await this.createTask(name, data[name], module);
            }
        }
    }

    async createTask (name, data) {
        const model = this.spawn('model/Task');
        model.assign(data);
        model.set('name', name);
        model.set('job', JSON.stringify(data.job));
        await model.save()
            ? this.log('info', `Task created: ${name}`)
            : this.log('error', `Invalid task: ${name}:`, model.getFirstErrorMap());
    }

    log () {
        this.owner.log(...arguments);
    }
};