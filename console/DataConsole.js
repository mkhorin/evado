/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const Base = require('areto/base/Base');

module.exports = class DataConsole extends Base {

    constructor (config) {
        super(config);
        this.params = Object.assign(this.getDefaultParams(), this.params);
        this.directory = this.app.getPath('data', this.params.dir || 'default');
        this.includes = this.params.includes ? this.wrapArray(this.params.includes) : null;
        this.excludes = this.params.excludes ? this.wrapArray(this.params.excludes) : null;
    }

    getDefaultParams () {
        return {};
    }

    async clear () {
        const models = this.getMetaModels(this.params.meta);
        for (const model of models) {
            await model.dropData();
        }
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

    wrapArray (data) {
        return Array.isArray(data) ? data : [data];
    }

    log () {
        this.owner.log(...arguments);
    }
};