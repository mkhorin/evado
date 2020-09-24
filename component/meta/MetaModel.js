/**
 * @copyright Copyright (c) 2019 Maxim Khorin (maksimovichu@gmail.com)
 */
'use strict';

const Base = require('areto/base/Base');

module.exports = class MetaModel extends Base {

    getDb () {
        return this.hub.getDb();
    }

    getDataTables () {
        return [];
    }

    getLanguage () {
        return this.module.getI18n().language;
    }

    getPath () {
        return this.hub.getPath(...arguments);
    }

    emit (event, data) {
        return this.module.emit(`meta.${this.name}.${event}`, data);
    }

    spawnUser () {
        return this.spawn(this.hub.User, ...arguments);
    }

    splitByModulePrefix () {
        return this.hub.splitByModulePrefix(...arguments);
    }

    async load () {
        this.data = await this.source.load();
    }

    async afterLoad () {
        // after load all meta models
    }

    createSource (data) {
        this.source = this.spawn(data, {meta: this});
    }

    afterDataImport () {
    }

    dropData () {
    }

    async dropTablesByPrefix (prefix) {
        const db = this.getDb();
        for (const name of await db.getTableNames()) {
            if (name.indexOf(prefix) === 0) {
                await db.drop(name);
            }
        }
    }

    resolveSpawn (config, ...args) {
        try {
            return ClassHelper.resolveSpawn(config, this.module, ...args);
        } catch {
            this.log('error', 'Invalid spawn configuration', config);
        }
    }

    createDataFinder () {
        return null;
    }

    log () {
        CommonHelper.log(this.hub, this.constructor.name, ...arguments);
    }
};

const ClassHelper = require('areto/helper/ClassHelper');
const CommonHelper = require('areto/helper/CommonHelper');