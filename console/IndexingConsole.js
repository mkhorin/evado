/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const Base = require('areto/base/Base');

module.exports = class IndexingConsole extends Base {

    async create () {
        await this.createModuleIndexes(this.app);
        this.log('info', 'Indexing done');
    }

    async createModuleIndexes (module) {
        await this.createByData(module.getConfig('indexes'), module);
        for (const child of module.getModules()) {
            await this.createModuleIndexes(child);
        }
    }

    async createByData (items, module) {
        if (Array.isArray(items)) {
            for (let item of items) {
                item = this.resolveData(item, module);
                if (item) {
                    await this.createByTable(...item, module);
                }
            }
        }
    }

    resolveData (data, module) {
        if (Array.isArray(data)) {
            return data; // ['table_name', [[{attr: 1}, {unique: true}]]]
        }
        const Class = typeof data !== 'function' ? module.getClass(data) : data;
        if (Class) {
            return [Class.TABLE, Class.INDEXES];
        }
        this.log('error', `Class not found: ${data}`);
    }

    async createByTable (table, items, module) {
        if (Array.isArray(items)) {
            for (const item of items) {
                await this.createIndex(item, table, module);
            }
        }
    }

    async createIndex (data, table, module) {
        try {
            this.log('info', `Create index: ${table}: ${JSON.stringify(data)}`);
            await module.getDb().createIndex(table, data);
        } catch (err) {
            this.log('error', err);
        }
    }

    log () {
        this.owner.log(...arguments);
    }
};