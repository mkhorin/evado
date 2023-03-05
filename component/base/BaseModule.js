/**
 * @copyright Copyright (c) 2020 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const Base = require('areto/base/Module');

module.exports = class BaseModule extends Base {

    static getConstants () {
        return {
            INHERITED_UNDEFINED_CONFIGURATION_KEYS:
                super.INHERITED_UNDEFINED_CONFIGURATION_KEYS.concat(['sideMenu'])
        };
    }

    getFileStorage () {
        return this.components.get('fileStorage');
    }

    getI18n () {
        return this.components.get('i18n');
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

    getSession () {
        return this.components.get('session');
    }

    getScheduler () {
        return this.components.get('scheduler');
    }

    getTitle () {
        return this.label || super.getTitle();
    }

    notify () {
        return this.getNotifier().execute(...arguments);
    }

    emit () {
        return this.getObserver().handle(...arguments);
    }
};
module.exports.init();
