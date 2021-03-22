/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const Base = require('areto/base/Base');

module.exports = class AssetConsole extends Base {

    constructor (config) {
        super({
            assetBuilder: require('./asset/AssetBuilder'),
            assetDeployer: require('./asset/AssetDeployer'),
            assetInstaller: require('./asset/AssetInstaller'),
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
        await this.execute(this.assetInstaller, this.getModule());
        this.log('info', 'Assets installed. Deploy assets to publish');
    }

    async build () {
        await this.execute(this.assetBuilder, this.getModule());
        this.log('info', 'Assets are built');
    }

    async deploy () {
        await this.execute(this.assetDeployer, this.getModule());
        this.log('info', 'Assets deployed');
    }

    async execute (config, module) {
        const executor = this.createAssetExecutor(config, module);
        await executor.execute();
        if (this.params.withModules) {
            for (const child of module.modules) {
                await this.execute(config, child);
            }
        }
    }

    createAssetExecutor (config, module) {
        return this.spawn(config, {console: this, module});
    }

    log () {
        this.owner.log(...arguments);
    }
};