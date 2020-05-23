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
        this.params = Object.assign(this.getDefaultParams(), this.params);
    }

    getDefaultParams () {
        return {
            withModules: true
        };
    }

    getModule () {
        const name = this.params.module;
        if (!name) {
            return this.app;
        }
        const module = this.app.getModule(name);
        if (!module) {
            throw new Error(`Module not found: ${name}`);
        }
        return module;
    }

    async install () {
        await this.execute('install', this.getModule());
        this.log('info', 'Vendors installed. Need to deploy assets to publish');
        await PromiseHelper.setImmediate();
    }

    async deploy () {
        await this.execute('deploy', this.getModule());
        this.log('info', 'Assets deployed');
        await PromiseHelper.setImmediate();
    }

    async execute (method, module) {
        const asset = this.createModuleAsset(module);
        await asset[method]();
        if (this.params.withModules) {
            for (const child of module.getModules()) {
                await this.executeModule(method, child);
            }
        }
    }

    createModuleAsset (module) {
        return this.spawn(this.ModuleAsset, {console: this, module});
    }

    log () {
        this.owner.log(...arguments);
    }
};

const PromiseHelper = require('areto/helper/PromiseHelper');