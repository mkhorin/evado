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
        let allErrors = [];
        for (let module of this.module.getOriginalHierarchy()) {
            let errors = await this.buildAsset(data, module.getPath());
            if (errors) {
                allErrors.push(...errors);
            } else {
                done = true;
            }
        }
        this.logResult(done, data, allErrors);
    }

    async buildAssets (items, root) {
        for (const data of items) {
            const errors = await this.buildAsset(data, root);
            this.logResult(!errors, data, errors);
        }
    }

    buildAsset (data, root) {
        try {
            data.Class = this.resolveHandlerClass(data.Class);
            return this.spawn(data, {
                sourceRoot: path.join(root, this.getSourceDir(data)),
                targetRoot: path.join(root, this.getTargetDir(data))
            }).execute();
        } catch (error) {
            return [error];
        }
    }

    resolveHandlerClass (name) {
        return this.hasOwnProperty(name) ? this[name] : name;
    }

    logResult (done, {target}, errors) {
        if (done) {
            return this.log('info', `Done: ${target}`);
        }
        for (const error of errors) {
            this.log('error', ...error);
        }
        this.log('error', `Not built: ${target}`);
    }
};

const PromiseHelper = require('areto/helper/PromiseHelper');
const path = require('path');