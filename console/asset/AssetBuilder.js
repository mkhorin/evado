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

    async execute () {
        for (const module of this.module.getOriginalHierarchy()) {
            const params = this.getParams(module);
            if (params.build) {
                const root = module.getPath();
                this.log('info', `Building assets: ${root}`);
                await this.buildAssets(params.build, root, params);
            }
        }
    }

    async buildAssets (items, root, params = this.getParams()) {
        for (const data of items) {
            await PromiseHelper.setTimeout(10);
            const errors = await this.buildAsset(data, root, params);
            this.logResult(data, errors);
        }
    }

    buildAsset (data, root, params) {
        data.Class = this.resolveHandlerClass(data.Class);
        return this.spawn(data, {
            sourceRoot: path.join(root, data.sourceDir || params.webDir),
            targetRoot: path.join(root, data.targetDir || params.webDir)
        }).execute();
    }

    resolveHandlerClass (name) {
        return this.hasOwnProperty(name) ? this[name] : name;
    }

    logResult ({target}, errors) {
        if (!Array.isArray(errors)) {
            return this.log('info', `Built: ${target}`);
        }
        for (const error of errors) {
            this.log('error', ...error);
        }
        this.log('error', `Not built: ${target}`);
    }
};

const PromiseHelper = require('areto/helper/PromiseHelper');
const path = require('path');