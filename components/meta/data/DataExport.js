'use strict';

const Base = require('areto/base/Base');

module.exports = class DataExport extends Base {

    constructor (config) {
        super(config);
        this.config = this.project.getConfig('export.data');
        this.config = {
            'dir': 'default',
            'enabled': false,
            'only': null, // ['tableName']
            'includes': [],
            'excludes': [],
            ...this.config
        };
        this.dir = this.project.getPath('data', this.data || this.config.dir);
    }

    async execute () {
        if (!this.config.enabled) {
            return this.project.log('warn', 'Data export disabled');
        }
        mkdirp.sync(this.dir);
        await this.exportClasses();
        await this.exportTables(this.config.only);
        await this.exportTables(this.config.includes);
        this.project.log('info', 'Data is exported');
    }

    isExcluded (table) {
        return this.config.excludes instanceof Array && this.config.excludes.includes(table);
    }

    async exportClasses () {
        if (this.config.only instanceof Array) {
            return this.project.log('info', 'Class export skipped');
        }
        for (let cls of this.project.classes) {
            if (!cls.getParent()) {
                await this.exportTable(cls.modelTable);
            }
        }
    }

    async exportTables (tables) {
        for (let table of tables) {
            await this.exportTable(table);
        }
    }

    async exportTable (table) {
        if (this.isExcluded(table)) {
            return this.project.log('info', `Table excluded: ${table}`);
        }
        let data = this.project.getDb().find(table, {});
        MongoHelper.replaceMongoDataToJson(data);
        data = JSON.stringify(data, null, 2);
        fs.writeFileSync(path.join(this.dir, `${table}.json`), data);
        this.project.log('info', `Exported: ${table}`);
    }
};

const fs = require('fs');
const mkdirp = require('mkdirp');
const path = require('path');
const MongoHelper = require('areto/helper/MongoHelper');