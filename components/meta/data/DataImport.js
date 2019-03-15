'use strict';

const Base = require('areto/base/Base');

module.exports = class DataImport extends Base {

    constructor (config) {
        super(config);
        this.config = this.project.getConfig('import.data');
        this.config = {
            'dir': 'default',
            'enabled': false,
            'truncate': false,
            'only': null, // ['tableName']
            'excludes': [],
            ...this.config
        };
        this.dir = this.project.getPath('data', this.data || this.config.dir);
    }

    async execute () {
        if (!this.config.enabled) {
            return this.log('warn', 'Data import disabled');
        }
        let files = [];
        try {
            files = fs.readdirSync(this.dir);
        } catch (err) {
            return this.log('warn', `Invalid import directory: ${this.dir}`);
        }
        for (let file of files) {
            if (FileHelper.isJsonExt(file)) {
                await this.importFile(path.join(this.dir, file));
            }
        }
        if (this.config.truncate) {
            await this.project.updateIndexes();
        }
        for (let cls of this.project.classes) {
            await AutoIncrementBehavior.normalize(cls);
        }
    }

    isExcluded (table) {
        return (Array.isArray(this.config.excludes) && this.config.excludes.includes(table))
            || (Array.isArray(this.config.only) && !this.config.only.includes(table));
    }

    async importFile (file) {
        let table = path.basename(file, '.json');
        if (this.isExcluded(table)) {
            return this.log('info', `File excluded: ${table}`);
        }
        let data = FileHelper.readJsonFile(file);
        if (!Array.isArray(data)) {
            return this.log('error', `Invalid data: ${file}`);
        }
        MongoHelper.replaceJsonToMongoData(data);
        if (this.config.truncate) {
            await this.project.getDb().truncate(table);
        }
        if (data.length) {
            await this.project.getDb().insert(table, data);
        }
        await PromiseHelper.setImmediate();
        this.log('info', `Imported: ${table}`);
    }
    
    log () {
        this.project.log.apply(this.project, arguments);
    }
};

const fs = require('fs');
const path = require('path');
const FileHelper = require('areto/helper/FileHelper');
const MongoHelper = require('areto/helper/MongoHelper');
const PromiseHelper = require('areto/helper/PromiseHelper');
const AutoIncrementBehavior = require('areto-meta-doc/behavior/AutoIncrementBehavior');