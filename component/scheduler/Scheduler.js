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

    getTaskByName (name) {
        for (const task of this._taskMap) {
            if (task.name === name) {
                return task;
            }
        }
    }

    addTask (model) {
        const config = model.resolve();
        if (config) {
            super.addTask(model.getId(), config);
        }
    }

    updateTask (model) {
        if (this.getTask(model.getId())) {
            this.deleteTask(model.getId());
        }
        this.addTask(model);
    }

    async taskDone ({sender}) {
        const model = await this.spawnTask().findById(sender.id).one();
        await model.saveDone();
        return super.taskDone(...arguments);
    }

    executeTask (name) {
        const task = this.getTaskByName(name);
        return super.executeTask(task ? task.id : null);
    }

    spawnTask () {
        return this.spawn('model/Task');
    }
};