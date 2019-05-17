'use strict';

const Base = require('areto/base/Base');

module.exports = class DataConsole extends Base {

    constructor (config) {
        super(config);
        this.dir = this.app.getPath('data', this.params.dir || 'default');
        this.includes = this.params.includes ? this.wrapArray(this.params.includes) : null;
        this.excludes = this.params.excludes ? this.wrapArray(this.params.excludes) : null;
    }

    async drop () {
        let models = this.getMetaModels(this.params.meta);
        for (let model of models) {
            await model.dropData();
        }
    }

    getMetaModels (names) {
        let meta = this.app.getMeta();
        if (!names) {
            return meta.models;
        }
        let models = [];
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

    log (...args) {
        this.console.log(...args);
    }
};