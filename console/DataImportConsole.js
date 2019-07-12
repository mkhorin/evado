/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const Base = require('./DataConsole');

module.exports = class DataImportConsole extends Base {

    async execute () {
        let files = [];
        try {
            files = await fs.promises.readdir(this.dir);
        } catch (err) {
            return this.log('error', `Invalid import directory: ${this.dir}`);
        }
        for (let file of files) {
            if (FileHelper.isJsonExtension(file)) {
                await this.importFile(path.join(this.dir, file));
            }
        }
        await this.app.getMeta().afterDataImport();
        this.log('info', `Data has been imported from ${this.dir}`);
    }

    async importFile (file) {
        let table = FileHelper.getBasename(file);
        if (this.isExcluded(table)) {
            return this.log('info', `File excluded: ${table}`);
        }
        let data = await FileHelper.readJsonFile(file);
        if (!Array.isArray(data)) {
            return this.log('error', `Invalid data: ${file}`);
        }
        MongoHelper.replaceJsonToMongoData(data);
        if (this.params.clear) {
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
        for (let doc of data) {
            await this.insert(table, doc);
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

const fs = require('fs');
const path = require('path');
const FileHelper = require('areto/helper/FileHelper');
const MongoHelper = require('areto/helper/MongoHelper');
const PromiseHelper = require('areto/helper/PromiseHelper');