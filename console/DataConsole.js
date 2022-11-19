/**
 * @copyright Copyright (c) 2020 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const Base = require('areto/base/Base');

module.exports = class DataConsole extends Base {

    constructor (config) {
        super(config);
        this.params = Object.assign(this.getDefaultParams(), this.params);
        this.directory = this.app.getPath('data', this.params.dir);
        this.includes = this.params.includes
            ? this.wrapArray(this.params.includes)
            : null;
        this.excludes = this.params.excludes
            ? this.wrapArray(this.params.excludes)
            : null;
    }

    getDefaultParams () {
        return {
            dir: 'default',
            files: true
        };
    }

    getFileStoragePath (storage) {
        return path.join(this.directory, 'file', storage.id);
    }

    async clear () {
        const models = this.getMetaModels(this.params.meta);
        for (const model of models) {
            await model.dropData();
        }
        if (this.params.files) {
            await this.deleteFiles();
        }
        this.log('info', 'Data deleted');
    }

    async deleteFiles () {
        const file = this.spawn('model/File');
        const raw = this.spawn('model/RawFile');
        await this.clearFileStorage(file, raw);
        this.log('info', 'Files deleted');
    }

    async clearFileStorage (file, raw) {
        const storage = file.getStorage();
        this.log('info', `Clear file storage: ${storage.id}`);
        await file.getDb().truncate(file.getTable());
        await raw.getDb().truncate(raw.getTable());
        await storage.deleteAll();
    }

    getMetaModels (names) {
        const metaHub = this.app.getMetaHub();
        if (!names) {
            return metaHub.models;
        }
        const models = [];
        for (const name of this.wrapArray(names)) {
            const model = metaHub.get(name);
            if (!model) {
                throw new Error(`Meta model not found: ${name}`);
            }
            models.push(model);
        }
        return models;
    }

    isExcluded (table) {
        return (Array.isArray(this.excludes) && this.excludes.includes(table))
            || (Array.isArray(this.includes) && !this.includes.includes(table));
    }

    excludeTable (table) {
        this.excludes = this.excludes
            ? this.excludes.concat(table)
            : [table];
    }

    includeTable (table) {
        this.includes = this.includes
            ? this.includes.concat(table)
            : [table];
    }

    wrapArray (data) {
        return Array.isArray(data) ? data : [data];
    }

    log () {
        this.owner.log(...arguments);
    }
};

const path = require('path');