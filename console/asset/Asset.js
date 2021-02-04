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

    getParams () {
        return Object.assign(this.getDefaultParams(), this.module.getConfig('assets'));
    }

    getDefaultParams () {
        return {
            assetDir: 'asset'
        };
    }

    log () {
        this.module.log(...arguments);
    }
};