/**
 * @copyright Copyright (c) 2021 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const Base = require('./Asset');

module.exports = class AssetBuild extends Base {

    constructor (config) {
        super({
            MergeFiles: require('./MergeFiles'),
            ...config
        });
    }

    async execute () {
        const data = this.params.build;
        if (data) {
            this.log('info', 'Building assets...');
            for (const data of this.params.build) {
                await PromiseHelper.setImmediate();
                await this.buildAsset(data);
            }
        }
    }

    async buildAsset (data) {
        let done = false;
        for (const module of this.module.getOriginalHierarchy()) {
            if (await this.buildModuleAsset(data, module)) {
                done = module;
            }
        }
        done ? this.log('info', `Done: ${data.target}`)
             : this.log('error', `Not built: ${data.target}`);
    }

    buildModuleAsset (data, module) {
        try {
            data.Class = this.resolveHandlerClass(data.Class);
            return this.spawn(data, {asset: this, module}).execute();
        } catch (err) {
            this.log('error', err);
        }
    }

    resolveHandlerClass (name) {
        return this.hasOwnProperty(name) ? this[name] : name;
    }
};

const PromiseHelper = require('areto/helper/PromiseHelper');