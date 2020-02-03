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
        this._utilityMap = this.resolveUtilityMap(this.utilities);
        this._utilities = Object.values(this._utilityMap);
        ObjectHelper.addKeyAsNestedValue('id', this._utilityMap);
    }

    resolveUtilityMap (data) {
        return (typeof data === 'string' ? this.resolveFromConfig(data) : data) || {};
    }

    resolveFromConfig (key) {
        return this.module.config.mergeWithParents(key);
    }

    async isActiveUtility (params) {
        for (const config of this._utilities) {
            if (await this.createUtility(config, params).isActive()) {
                return true;
            }
        }
        return false;
    }

    getUtilityConfig (id) {
        return Object.prototype.hasOwnProperty.call(this._utilityMap, id) ? this._utilityMap[id] : null;
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

const ObjectHelper = require('areto/helper/ObjectHelper');