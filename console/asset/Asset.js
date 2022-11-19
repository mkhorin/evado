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
        return Object.assign(this.getDefaultParams(), config.getOwn('assets'));
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