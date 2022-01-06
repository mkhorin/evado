/**
 * @copyright Copyright (c) 2021 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const Base = require('./Asset');

module.exports = class AssetDeployer extends Base {

    async execute () {
        for (const module of this.module.getOriginalHierarchy()) {
            const params = this.getParams(module);
            if (params.deploy) {
                const root = module.getPath();
                this.log('info', `Deploying assets: ${root}`);
                await this.deployAssets(params.deploy, root, params);
            }
        }
    }

    async deployAssets (data, root, params = this.getParams()) {
        for (const key of Object.keys(data)) {
            await PromiseHelper.setTimeout(10);
            await this.deployAsset(key, data[key], root, params);
        }
    }

    async deployAsset (key, data, root, params) {
        const source = path.join(root, params.assetDir);
        const target = path.join(root, params.webDir, key);
        const files = typeof data === 'string' ? [data] : data;
        for (const file of files) {
            if (await this.copyFile(path.join(source, file), target)) {
                this.log('info', `Deployed ${file} to ${key}`);
            } else {
                this.log('error', `Not deployed ${file} to ${key}`);
            }
        }
    }

    async copyFile (source, target) {
        try {
            const stat = await FileHelper.getStat(source);
            if (!stat) {
                return false;
            }
            if (stat.isFile()) {
                target = path.join(target, path.basename(source));
            }
            await FileHelper.copy(source, target);
            return true;
        } catch (err) {
            this.log('error', err);
        }
    }
};

const FileHelper = require('areto/helper/FileHelper');
const PromiseHelper = require('areto/helper/PromiseHelper');
const path = require('path');