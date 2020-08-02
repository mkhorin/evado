/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const Base = require('areto/scheduler/Scheduler');

module.exports = class Scheduler extends Base {

    async init () {
        await super.init();
        this.module.on(this.module.EVENT_AFTER_INIT, this.load.bind(this));
    }

    async load () {
        this.deleteAllTasks();
        const models = await this.spawnTask().find().all();
        for (const model of models) {
            this.addTask(model);
        }
    }

    addTask (model) {
        const config = model.resolve();
        if (config) {
            super.addTask(model.getName(), config);
        }
    }

    updateTask (model) {
        const name = model.getName();
        if (this.getTask(name)) {
            this.deleteTask(name);
        }
        this.addTask(model);
    }

    async taskDone ({sender}) {
        const model = await this.spawnTask().findByName(sender.name).one();
        if (model) {
            await model.saveDone();
        }
        return super.taskDone(...arguments);
    }

    executeTask (name) {
        if (this.getTask(name)) {
            return super.executeTask(name);
        }
    }

    spawnTask () {
        return this.spawn('model/Task');
    }
};