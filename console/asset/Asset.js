/**
 * @copyright Copyright (c) 2021 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const Base = require('areto/base/Base');

module.exports = class ModuleAsset extends Base {

    constructor (config) {
        super(config);
        this.params = this.getParams();
    }

    getAssetDir () {
        return this.params.assetDir;
    }

    getWebDir () {
        return this.params.webDir;
    }

    getParams () {
        return Object.assign(this.getDefaultParams(), this.params || this.module.getConfig('assets'));
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