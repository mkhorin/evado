/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const Base = require('./DataConsole');

module.exports = class DataImportConsole extends Base {

    async execute () {
        await FileHelper.createDir(this.dir);
        await this.exportMeta();
        await this.exportTables(this.includes);
        this.log('info', `Data exported to ${this.dir}`);
    }

    async exportMeta () {
        const models = this.getMetaModels(this.params.meta);
        for (let model of models) {
            await model.exportData(this.exportTable.bind(this));
        }
    }

    async exportTables (tables) {
        if (Array.isArray(tables)) {
            for (let table of tables) {
                await this.exportTable(table);
            }
        }
    }

    async exportTable (table) {
        if (this.isExcluded(table)) {
            return this.log('info', `Table excluded: ${table}`);
        }
        let data = await this.app.getDb().find(table, {});
        MongoHelper.normalizeExportData(data);
        data = JSON.stringify(data, null, parseInt(this.params.space));
        await fs.promises.writeFile(path.join(this.dir, `${table}.json`), data);
        this.log('info', `Exported: ${table}`);
    }
};

const fs = require('fs');
const path = require('path');
const FileHelper = require('areto/helper/FileHelper');
const MongoHelper = require('areto/helper/MongoHelper');