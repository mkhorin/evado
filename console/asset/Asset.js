/**
 * @copyright Copyright (c) 2021 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const Base = require('areto/base/Base');

module.exports = class ModuleAsset extends Base {

    constructor (config) {
        super(config);
        this.params = this.getParams(this.module);
    }

    getParams ({config} = this.module) {
        const defaults = this.getDefaultParams();
        const params = config.getOwn('assets');
        return Object.assign(defaults, params);
    }

    getDefaultParams () {
        return {
            assetDir: 'asset',
            webDir: 'web'
        };
    }

    log () {
        this.module.log(...arguments);
    }
};