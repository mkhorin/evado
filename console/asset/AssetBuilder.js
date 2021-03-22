/**
 * @copyright Copyright (c) 2021 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const Base = require('./Asset');

module.exports = class AssetBuilder extends Base {

    constructor (config) {
        super({
            Packer: require('./Packer'),
            ...config
        });
    }

    getSourceDir (data) {
        return data.sourceDir || this.getWebDir();
    }

    getTargetDir (data) {
        return data.targetDir || this.getWebDir();
    }

    async execute () {
        if (this.params.build) {
            this.log('info', 'Building assets...');
            for (const data of this.params.build) {
                await PromiseHelper.setImmediate();
                await this.buildModuleAssets(data);
            }
        }
    }

    async buildModuleAssets (data) {
        let done = false;
        for (const module of this.module.getOriginalHierarchy()) {
            if (await this.buildAsset(data, module.getPath())) {
                done = true;
            }
        }
        this.logResult(done, data);
    }

    async buildAssets (items, root) {
        for (const data of items) {
            const done = await this.buildAsset(data, root);
            this.logResult(done, data);
        }
    }

    buildAsset (data, root) {
        try {
            data.Class = this.resolveHandlerClass(data.Class);
            return this.spawn(data, {
                sourceRoot: path.join(root, this.getSourceDir(data)),
                targetRoot: path.join(root, this.getTargetDir(data))
            }).execute();
        } catch (err) {
            this.log('error', err);
        }
    }

    resolveHandlerClass (name) {
        return this.hasOwnProperty(name) ? this[name] : name;
    }

    logResult (done, {target}) {
        done ? this.log('info', `Done: ${target}`)
             : this.log('error', `Not built: ${target}`);
    }
};

const PromiseHelper = require('areto/helper/PromiseHelper');
const path = require('path');