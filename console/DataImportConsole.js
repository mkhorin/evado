/**
 * @copyright Copyright (c) 2020 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const Base = require('./DataConsole');

module.exports = class DataImportConsole extends Base {

    isClear () {
        return this.params.clear;
    }

    getDefaultParams () {
        return Object.assign(super.getDefaultParams(), {
            clear: false,
            oneByOne: true
        });
    }

    async execute () {
        this.params.files
            ? await this.importFiles()
            : this.skipFileImport();
        await this.importData();
        this.log('info', `Data imported: ${this.directory}`);
    }

    async importFiles () {
        await this.importFileStorage(this.spawn('model/File'));
        this.log('info', 'Files imported');
    }

    async importFileStorage (file) {
        const storage = file.getStorage();
        this.log('info', `Import file storage: ${storage.id}`);
        if (this.isClear()) {
            await storage.deleteAll();
        }
        const source = this.getFileStoragePath(storage);
        await storage.copyFrom(source);
    }

    skipFileImport () {
        this.excludeTable(this.getClass('model/File').TABLE);
        this.excludeTable(this.getClass('model/RawFile').TABLE);
    }

    async importData () {
        const files = await FileHelper.readDirectory(this.directory);
        for (const file of files) {
            if (FileHelper.isJsonExtension(file)) {
                await this.importDataFile(path.join(this.directory, file));
            }
        }
        await this.app.getMetaHub().afterDataImport();
    }

    async importDataFile (file) {
        const table = FileHelper.getBasename(file);
        if (this.isExcluded(table)) {
            return this.log('info', `Table excluded: ${table}`);
        }
        const data = await FileHelper.readJsonFile(file);
        if (!Array.isArray(data)) {
            return this.log('error', `Invalid data: ${file}`);
        }
        MongoHelper.normalizeImportData(data);
        if (this.isClear()) {
            await this.app.getDb().truncate(table);
        }
        if (data.length) {
            this.params.oneByOne
                ? await this.insertOneByOne(table, data)
                : await this.insert(table, data);
        }
        await PromiseHelper.setImmediate();
        this.log('info', `Imported: ${table}`);
    }

    async insertOneByOne (table, data) {
        for (const doc of data) {
            await this.insert(table, doc);
            await PromiseHelper.setImmediate();
        }
    }

    async insert (table, data) {
        try {
            await this.app.getDb().insert(table, data);
        } catch (err) {
            this.log('error', err);
        }
    }
};

const path = require('path');
const FileHelper = require('areto/helper/FileHelper');
const MongoHelper = require('areto/helper/MongoHelper');
const PromiseHelper = require('areto/helper/PromiseHelper');