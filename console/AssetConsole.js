/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const Base = require('areto/base/Base');

module.exports = class AssetConsole extends Base {

    constructor (config) {
        super({
            assetBuild: require('./asset/AssetBuild'),
            assetDeploy: require('./asset/AssetDeploy'),
            assetInstall: require('./asset/AssetInstall'),
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
        await this.execute(this.assetInstall, this.getModule());
        this.log('info', 'Assets installed. Deploy assets to publish');
    }

    async build () {
        await this.execute(this.assetBuild, this.getModule());
        this.log('info', 'Assets built. Deploy assets to publish');
    }

    async deploy () {
        await this.execute(this.assetDeploy, this.getModule());
        this.log('info', 'Assets deployed');
    }

    async execute (config, module) {
        const asset = this.createModuleAsset(config, module);
        await asset.execute();
        if (this.params.withModules) {
            for (const child of module.modules) {
                await this.execute(config, child);
            }
        }
    }

    createModuleAsset (config, module) {
        return this.spawn(config, {console: this, module});
    }

    log () {
        this.owner.log(...arguments);
    }
};