/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const Base = require('areto/base/Base');

module.exports = class IndexingConsole extends Base {

    async create () {
        await this.createModuleIndexes(this.app);
        this.log('info', 'Indexing ready');
    }

    async createModuleIndexes (module) {
        await this.createByData(module.getConfig('indexes'), module);
        for (let child of module.getModules()) {
            await this.createModuleIndexes(child);
        }
    }

    async createByData (data, module) {
        if (data) {
            for (let table of Object.keys(data)) {
                await this.createByTable(table, data[table], module);
            }
        }
    }

    async createByTable (table, items, module) {
        if (Array.isArray(items)) {
            for (let item of items) {
                await this.createByItem(item, table, module);
            }
        }
    }

    async createByItem (item, table, module) {
        try {
            this.log('info', `Create index for ${table}: ${JSON.stringify(item)}`);
            await module.getDb().createIndex(table, item);
        } catch (err) {
            this.log('error', err);
        }
    }

    log () {
        this.owner.log(...arguments);
    }
};