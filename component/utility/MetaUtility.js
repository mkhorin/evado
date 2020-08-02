/**
 * @copyright Copyright (c) 2020 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const Base = require('./Utility');

module.exports = class MetaUtility extends Base {

    isActive () {
        return super.isActive() && this.isTargetMeta();
    }

    async isTargetMeta () {
        if (!this.targetClass) {
            return true;
        }
        const data = await this.resolveMetaParams();
        return data.class && data.class.name === this.targetClass;
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
        if (!meta) {
            return {};    
        }
        const result = {view: this.getBaseMeta().getView(meta)};        
        if (!result.view) {
            throw new BadRequest('View not found');                
        }        
        result.class = result.view.class;        
        if (model) {
            result.model = await this.findModel(result.view, model).one();
            if (!result.model) {
                throw new BadRequest('Model not found');
            }
        }
        return result;
    }
};

const BadRequest = require('areto/error/http/BadRequest');
const MetaSecurity = require('../meta/MetaSecurity');