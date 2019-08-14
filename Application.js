/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const Base = require('areto/base/Application');

module.exports = class Evado extends Base {

    catch () {
        return this.components.get('observer').catch(...arguments);
    }

    // EVENTS

    async afterModuleInit () {
        await this.addSchedulerTasks(this);
        await this.loadMetaData();
        await super.afterModuleInit();
    }

    // META

    getMeta (name) {
        return this.getMetaHub().get(name);
    }

    getMetaHub () {
        return this.components.get('metaHub');
    }
    
    async loadMetaData () {
        const hub = this.getMetaHub();
        hub.models.add(this.getConfig('metaModels'));
        await hub.load();
    }

    // SCHEDULER

    addSchedulerTasks (module) {
        this.get('scheduler').addTasks(module.getConfig('tasks'), {module});
        for (const child of module.modules) {
            this.addSchedulerTasks(child);
        }
    }
};
module.exports.init(module);