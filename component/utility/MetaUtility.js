/**
 * @copyright Copyright (c) 2020 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const Base = require('./Utility');

module.exports = class MetaUtility extends Base {

    isActive () {
        const params = this.resolveMetaParams();
        return this.enabled && (!this.targetClass || params.class.name === this.targetClass);
    }

    getBaseMeta () {
        return this.module.getBaseMeta();
    }

    createMetaSecurity (config) {
        return this.spawn(MetaSecurity, {
            controller: this.controller,
            ...config
        });
    }

    findModel (view, id, params) {
        return view.findById(id, this.getSpawnConfig(params));
    }

    async createModel (view, params) {
        const model = view.createModel(this.getSpawnConfig(params));
        await model.setDefaultValues();
        return model;
    }

    async resolveMetaParams () {
        if (!this.metaParams) {
            this.metaParams = await this.parseBaseMeta(...arguments);
        }
        return this.metaParams;
    }

    async parseBaseMeta (meta = this.postParams.meta, model = this.postParams.model) {
        const index = meta.indexOf('.');
        const className = meta.substring(index + 1);
        const viewName = meta.substring(0, index);
        const result = {class: this.getBaseMeta().getClass(className)};
        if (result.class) {
            result.view = result.class.getView(viewName) || result.class;
            if (model) {
                result.model = await this.findModel(result.view, model).one();
                if (!result.model) {
                    throw new BadRequest('Model not found');
                }
            }
        }
        return result;
    }
};

const BadRequest = require('areto/error/BadRequestHttpException');
const MetaSecurity = require('../meta/MetaSecurity');