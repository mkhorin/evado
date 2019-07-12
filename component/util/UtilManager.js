/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const Base = require('areto/base/Component');

module.exports = class UtilManager extends Base {

    constructor (config) {
        super({
            utilMap: 'utils',
            url: `${config.module.NAME}/default/util`,
            ...config
        });
    }

    async init () {
        this.utilMap = this.resolveUtilMap(this.utilMap);
        this._utils = Object.values(this.utilMap);
        ObjectHelper.addKeyAsNestedValue('id', this.utilMap);
    }

    resolveUtilMap (map) {
        return (typeof map === 'string' ? this.module.getConfig(map) : map) || {};
    }

    async hasEnabled (params) {
        for (let util of this._utils) {
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
        return Object.prototype.hasOwnProperty.call(this.utilMap, id) ? this.utilMap[id] : null;
    }

    createUtil (config, params) {
        params.manager = this;
        params.module = params.controller.module;
        return new config.Class({...config, ...params});
    }
};
module.exports.init();

const ObjectHelper = require('areto/helper/ObjectHelper');