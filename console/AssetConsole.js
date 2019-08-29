/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const Base = require('areto/base/Base');

module.exports = class AssetConsole extends Base {

    constructor (config) {
        super({
            ModuleAsset: require('./ModuleAsset'),
            ...config
        });
    }

    async install () {
        await this.createModuleAsset(this.app).install();
        this.log('info', 'Vendors installed. Need to deploy assets to publish');
        await PromiseHelper.setImmediate();
    }

    async deploy () {
        await this.createModuleAsset(this.app).deploy();
        this.log('info', 'Assets deployed');
        await PromiseHelper.setImmediate();
    }

    createModuleAsset (module) {
        return this.spawn(this.ModuleAsset, {console: this, module});
    }

    log () {
        this.owner.log(...arguments);
    }
};

const PromiseHelper = require('areto/helper/PromiseHelper');