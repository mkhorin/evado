/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const Base = require('areto/base/Application');

module.exports = class Evado extends Base {

    // EVENTS

    async afterModuleInit () {
        await this.addSchedulerTasks(this);
        await this.loadMeta();
        await super.afterModuleInit();
    }

    // META

    getMeta () {
        return this.components.get('meta');
    }

    getMetaPath () {
        return this.getPath(this.getMetaDir(...arguments));
    }

    getMetaDir () {
        return path.join(this.getParam('metaRoot'), ...arguments);
    }

    async loadMeta () {
        let meta = this.getMeta();
        meta.models.add(this.getConfig('metaModels'));
        await meta.load();
    }

    // SCHEDULER

    addSchedulerTasks (module) {
        this.get('scheduler').addTasks(module.getConfig('tasks'), {module});
        for (let child of module.modules) {
            this.addSchedulerTasks(child);
        }
    }
};
module.exports.init(module);

const path = require('path');