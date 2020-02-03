/**
 * @copyright Copyright (c) 2019 Maxim Khorin (maksimovichu@gmail.com)
 */
'use strict';

const Base = require('areto/base/Base');

module.exports = class BaseMetaModel extends Base {

    getDb () {
        return this.hub.getDb();
    }

    getDataTables () {
        return [];
    }

    getPath () {
        return this.hub.getPath(...arguments);
    }

    emitEvent (name, data) {
        return this.module.emitEvent(`meta.${this.name}.${name}`, data);
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

    log () {
        CommonHelper.log(this.hub, this.constructor.name, ...arguments);
    }
};

const CommonHelper = require('areto/helper/CommonHelper');