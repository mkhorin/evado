/**
 * @copyright Copyright (c) 2020 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const Base = require('./Utility');

module.exports = class MetaUtility extends Base {

    /**
     * Check utility availability
     * @returns {Promise<boolean>}
     */
    isActive () {
        return super.isActive() && this.isTargetMeta();
    }

    async isTargetMeta () {
        if (!this.targetClass) {
            return true;
        }
        const data = await this.resolveMetaParams();
        return data.class?.name === this.targetClass;
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
        const config = this.getSpawnConfig(params);
        return view.createQuery(config).byId(id);
    }

    async createModel (view, params) {
        const config = this.getSpawnConfig(params);
        const model = view.createModel(config);
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
        if (!meta) {
            return {};
        }
        const result = {
            view: this.getBaseMeta().getView(meta)
        };
        if (!result.view) {
            throw new BadRequest('View not found');
        }
        result.class = result.view.class;
        if (model) {
            const query = this.findModel(result.view, model);
            result.model = await query.one();
            if (!result.model) {
                throw new BadRequest('Model not found');
            }
        }
        return result;
    }
};

const BadRequest = require('areto/error/http/BadRequest');
const MetaSecurity = require('../meta/MetaSecurity');