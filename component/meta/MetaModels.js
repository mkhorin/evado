/**
 * @copyright Copyright (c) 2019 Maxim Khorin (maksimovichu@gmail.com)
 */
'use strict';

const Base = require('areto/base/DataMap');

module.exports = class MetaModels extends Base {

    constructor (config) {
        super();
        Object.assign(this, config);
    }

    add (data) {
        for (let id of Object.keys(data || {})) {
            this.addModel(id, this.createModel(data[id]));
        }
    }

    addModel (id, model) {
        if (!model) {
            return this.hub.log('info', `Meta model skipped: ${id}`);
        }
        if (this.has(id)) {
            return this.hub.logError(`Meta model already exists: ${id}`);
        }
        this.set(id, model);
    }

    createModel (data) {
        if (data) {
            return ClassHelper.spawn(data, {
                hub: this.hub,
                module: this.hub.module
            });
        }
    }

    async load () {
        for (let model of this) {
            await model.load();
        }
        return this.afterLoad();
    }

    async afterLoad () {
        for (let model of this) {
            await model.afterLoad();
        }
    }
};

const ClassHelper = require('areto/helper/ClassHelper');