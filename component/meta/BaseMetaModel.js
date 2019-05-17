/**
 * @copyright Copyright (c) 2019 Maxim Khorin (maksimovichu@gmail.com)
 */
'use strict';

const Base = require('areto/base/Base');

module.exports = class BaseMetaModel extends Base {

    getModule () {
        return this.hub.module;
    }

    getPath (...args) {
        return this.hub.getMetaPath(...args);
    }

    getDb () {
        return this.hub.getDb();
    }

    splitByModulePrefix (...args) {
        return this.hub.splitByModulePrefix(...args);
    }

    async load () {
        this.data = await this.source.load();
    }

    createSource (data) {
        this.source = this.spawn(data, {metaModel: this});
    }

    afterDataImport () {}

    exportData () {}

    dropData () {}

    updateIndexes () {}

    log (type, message, data) {
        CommonHelper.log(type, message, data, this.constructor.name, this.hub);
    }

    logError (...args) {
        this.log('error', ...args);
    }
};

const CommonHelper = require('areto/helper/CommonHelper');