/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const Base = require('areto/base/Component');

module.exports = class UtilityManager extends Base {

    constructor (config) {
        super({
            utilities: 'utilities',
            ...config
        });
    }

    async init () {
        this._utilityMap = this.resolveUtilityMap(this.utilities) || {};
        this.resolveUtilityConfigs();
        this._utilities = Object.values(this._utilityMap);
        ObjectHelper.addKeyAsNestedValue('id', this._utilityMap);
    }

    resolveUtilityMap (data) {
        return typeof data === 'string' ? this.resolveFromConfig(data) : data;
    }

    resolveFromConfig (key) {
        return this.module.config.mergeWithParents(key);
    }

    resolveUtilityConfigs () {
        const data = this._utilityMap;
        for (const key of Object.keys(data)) {
            try {
                ClassHelper.resolveSpawn(data[key], this.module);
            } catch {
                this.log('error', 'Invalid utility configuration:', data[key]);
                delete data[key];
            }
        }
    }

    async getActiveItems (params) {
        const result = [];
        for (const utility of await this.createUtilities(params)) {
            result.push(await utility.getJson());
        }
        return result;
    }

    getUtilityConfig (id) {
        return ObjectHelper.getValue(id, this._utilityMap);
    }

    async createUtilities (params) {
        const result = [];
        for (let config of this._utilities) {
            const utility = this.createUtility(config, params);
            if (await utility.isActive() && await utility.canAccess()) {
                result.push(utility);
            }
        }
        return result;
    }

    createUtility (config, params) {
        params.manager = this;
        params.module = params.controller.module;
        return new config.Class({...config, ...params});
    }
};
module.exports.init();

const ClassHelper = require('areto/helper/ClassHelper');
const ObjectHelper = require('areto/helper/ObjectHelper');