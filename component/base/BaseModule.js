/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const Base = require('areto/base/Module');

module.exports = class BaseModule extends Base {

    getTitle () {
        return this.label || super.getTitle();
    }

    getMeta (name) {
        return this.getMetaHub().get(name);
    }

    getMetaHub () {
        return this.components.get('metaHub');
    }

    catch () {
        return this.components.get('observer').catch(...arguments);
    }
};