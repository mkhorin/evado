/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const Base = require('areto/base/Application');

module.exports = class Evado extends Base {

    getMailer () {
        return this.components.get('mailer');
    }

    getNotifier () {
        return this.components.get('notifier');
    }

    getObserver () {
        return this.components.get('observer');
    }

    getRbac () {
        return this.components.get('rbac');
    }

    getScheduler () {
        return this.components.get('scheduler');
    }

    emitEvent (name, data) {
        return this.getObserver().catch(name, data);
    }

    // EVENTS

    async afterModuleInit () {
        await this.loadMeta();
        return super.afterModuleInit();
    }

    // META

    getMeta (name) {
        return this.getMetaHub().get(name);
    }

    getMetaHub () {
        return this.components.get('metaHub');
    }
    
    async loadMeta () {
        const hub = this.getMetaHub();
        hub.models.add(this.getConfig('metaModels'));
        await hub.load();
    }
};
module.exports.init(module);