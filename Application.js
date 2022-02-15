/**
 * @copyright Copyright (c) 2020 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const Base = require('areto/base/Application');

module.exports = class EvadoApplication extends Base {

    getFileStorage () {
        return this.components.get('fileStorage');
    }

    getI18n () {
        return this.components.get('i18n');
    }

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

    emit (event, data) {
        return this.getObserver().handle(event, data);
    }

    // EVENTS

    async afterModuleInit () {
        await this.loadMeta();
        return super.afterModuleInit();
    }

    // META

    getBaseMeta () {
        return this.getMeta('base');
    }

    getMeta (name) {
        return this.getMetaHub().get(name);
    }

    getMetaHub () {
        return this.components.get('metaHub');
    }

    loadMeta () {
        const hub = this.getMetaHub();
        hub.models.add(this.getConfig('metaModels'));
        return hub.load();
    }
};
module.exports.init(module);