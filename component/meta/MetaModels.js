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
        if (data) {
            for (const id of Object.keys(data)) {
                if (data[id]) {
                    this.addModel(id, this.createModel(data[id]));
                }
            }
        }
    }

    addModel (id, model) {
        if (!model) {
            return this.log('info', `Meta model skipped: ${id}`);
        }
        if (this.has(id)) {
            return this.log('error', `Meta model already exists: ${id}`);
        }
        this.set(id, model);
    }

    createModel (data) {
        return ClassHelper.spawn(data, {
            hub: this.hub,
            module: this.hub.module
        });
    }

    async load () {
        for (const model of this) {
            await model.load();
        }
        return this.afterLoad();
    }

    async afterLoad () {
        for (const model of this) {
            await model.afterLoad();
        }
    }

    log () {
        this.hub.log(...arguments);
    }
};

const ClassHelper = require('areto/helper/ClassHelper');