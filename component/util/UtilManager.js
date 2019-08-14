/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const Base = require('areto/base/Component');

module.exports = class UtilManager extends Base {

    constructor (config) {
        super({
            utils: 'utils',
            url: `${config.module.NAME}/default/util`,
            ...config
        });
    }

    async init () {
        this._utilMap = this.resolveUtils(this.utils);
        this._utils = Object.values(this._utilMap);
        ObjectHelper.addKeyAsNestedValue('id', this._utilMap);
    }

    resolveUtils (data) {
        return (typeof data === 'string' ? this.module.getConfig(data) : data) || {};
    }

    async hasEnabled (params) {
        for (const util of this._utils) {
            if (await this.createUtil(util, params).isEnabled()) {
                return true;
            }
        }
        return false;
    }

    async renderControls (params) {
        let result = '';
        for (let util of this._utils) {
            util = this.createUtil(util, params);
            if (await util.isEnabled()) {
                result += await util.renderControl();
            }
        }
        return result;
    }

    getUtilConfig (id) {
        return Object.prototype.hasOwnProperty.call(this._utilMap, id) ? this._utilMap[id] : null;
    }

    createUtil (config, params) {
        params.manager = this;
        params.module = params.controller.module;
        return new config.Class({...config, ...params});
    }
};
module.exports.init();

const ObjectHelper = require('areto/helper/ObjectHelper');