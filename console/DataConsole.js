/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const Base = require('areto/base/Base');

module.exports = class DataConsole extends Base {

    constructor (config) {
        super(config);
        this.params = this.params || {};
        this.dir = this.app.getPath('data', this.params.dir || 'default');
        this.includes = this.params.includes ? this.wrapArray(this.params.includes) : null;
        this.excludes = this.params.excludes ? this.wrapArray(this.params.excludes) : null;
    }

    async drop () {
        const models = this.getMetaModels(this.params.meta);
        for (let model of models) {
            await model.dropData();
        }
    }

    getMetaModels (names) {
        const meta = this.app.getMeta();
        if (!names) {
            return meta.models;
        }
        const models = [];
        for (let name of this.wrapArray(names)) {
            let model = meta.getModel(name);
            if (!model) {
                throw new Error(`Not found meta model: ${name}`);
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
        this.console.log(...arguments);
    }
};