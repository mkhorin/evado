/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const Base = require('areto/base/Component');

module.exports = class UtilityManager extends Base {

    constructor (config) {
        super({
            utilities: 'utilities',
            url: `${config.module.NAME}/default/utility`,
            ...config
        });
    }

    async init () {
        this._utilityMap = this.resolveUtilities(this.utilities);
        this._utilities = Object.values(this._utilityMap);
        ObjectHelper.addKeyAsNestedValue('id', this._utilityMap);
    }

    resolveUtilities (data) {
        return (typeof data === 'string' ? this.module.getConfig(data) : data) || {};
    }

    async isActiveUtility (params) {
        for (const config of this._utilities) {
            if (await this.createUtility(config, params).isActive()) {
                return true;
            }
        }
        return false;
    }

    async renderControls (params) {
        let result = '';
        for (let config of this._utilities) {
            const utility = this.createUtility(config, params);
            if (await utility.isActive() && await utility.canAccess()) {
                result += await utility.renderControl();
            }
        }
        return result;
    }

    getUtilityConfig (id) {
        return Object.prototype.hasOwnProperty.call(this._utilityMap, id) ? this._utilityMap[id] : null;
    }

    createUtility (config, params) {
        params.manager = this;
        params.module = params.controller.module;
        return new config.Class({...config, ...params});
    }
};
module.exports.init();

const ObjectHelper = require('areto/helper/ObjectHelper');