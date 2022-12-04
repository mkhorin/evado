/**
 * @copyright Copyright (c) 2020 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const Base = require('./DataConsole');

module.exports = class DataImportConsole extends Base {

    getDefaultParams () {
        return Object.assign(super.getDefaultParams(), {
            space: 1
        });
    }

    async execute () {
        await FileHelper.delete(this.directory);
        await FileHelper.createDirectory(this.directory);
        await this.exportMeta();
        await this.exportTables(this.includes);
        if (this.params.files) {
            await this.exportFiles();
        }
        this.log('info', `Data exported to ${this.directory}`);
    }

    async exportMeta () {
        const models = this.getMetaModels(this.params.meta);
        for (const model of models) {
            await this.exportTables(model.getDataTables());
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
        if (!data.length) {
            return this.log('info', `Table is empty: ${table}`);
        }
        MongoHelper.normalizeExportData(data);
        data = JSON.stringify(data, null, Number(this.params.space));
        let file = path.join(this.directory, `${table}.json`);
        await fs.promises.writeFile(file, data);
        this.log('info', `Exported: ${table}`);
    }

    async exportFiles () {
        const file = this.spawn('model/File');
        const raw = this.spawn('model/RawFile');
        await this.exportFileStorage(file, raw);
        this.log('info', `Files exported`);
    }

    async exportFileStorage (file, raw) {
        const storage = file.getStorage();
        this.log('info', `Export file storage: ${storage.id}`);
        await this.exportTable(file.getTable());
        await this.exportTable(raw.getTable());
        await storage.copyTo(this.getFileStoragePath(storage));
    }
};

const FileHelper = require('areto/helper/FileHelper');
const MongoHelper = require('areto/helper/MongoHelper');
const fs = require('fs');
const path = require('path');