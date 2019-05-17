'use strict';

const Base = require('areto/base/Application');

module.exports = class Evado extends Base {

    // EVENTS

    async afterComponentInit () {
        this.addSchedulerTasks(this);
        await super.afterComponentInit();
    }

    async afterModuleInit () {
        await this.loadMeta();
        await super.afterModuleInit();
    }

    // META

    getMeta () {
        return this.components.get('meta');
    }

    getMetaPath (...args) {
        return this.getPath(this.getMetaDir(...args));
    }

    getMetaDir (...args) {
        return path.join(this.getParam('metaRoot'), ...args);
    }

    async loadMeta () {
        let meta = this.getMeta();
        meta.models.add(this.getConfig('metaModels'));
        await meta.load();
    }

    createServiceNav () {
        let meta = this.getMeta();
        let nav = meta.getModel('nav');
        nav.createDocServiceNav(meta.getModel('doc'), ['doc']);
    }

    // SCHEDULER

    addSchedulerTasks (module) {
        this.get('scheduler').addTasks(module.getConfig('tasks'));
        for (let child of module.modules) {
            this.addSchedulerTasks(child);
        }
    }
};
module.exports.init(module);

const path = require('path');