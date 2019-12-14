/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const Base = require('./DataConsole');

module.exports = class DataImportConsole extends Base {

    getDefaultParams () {
        return {space: 2};
    }

    async execute () {
        await FileHelper.createDirectory(this.directory);
        await this.exportMeta();
        await this.exportTables(this.includes);
        this.log('info', `Data exported: ${this.directory}`);
    }

    async exportMeta () {
        const models = this.getMetaModels(this.params.meta);
        for (const model of models) {
            await model.exportData(this.exportTable.bind(this));
        }
    }

    async exportTables (tables) {
        if (Array.isArray(tables)) {
            for (const table of tables) {
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
        await fs.promises.writeFile(path.join(this.directory, `${table}.json`), data);
        this.log('info', `Exported: ${table}`);
    }
};

const fs = require('fs');
const path = require('path');
const FileHelper = require('areto/helper/FileHelper');
const MongoHelper = require('areto/helper/MongoHelper');