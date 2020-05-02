/**
 * @copyright Copyright (c) 2020 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const Base = require('areto/base/Module');

module.exports = class BaseModule extends Base {

    getFileStorage () {
        return this.components.get('fileStorage');
    }

    getMailer () {
        return this.components.get('mailer');
    }

    getBaseMeta () {
        return this.getMeta('base');
    }

    getMeta (name) {
        return this.getMetaHub().get(name);
    }

    getMetaHub () {
        return this.components.get('metaHub');
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

    getTitle () {
        return this.label || super.getTitle();
    }

    emitEvent (name, data) {
        return this.getObserver().catch(name, data);
    }
};