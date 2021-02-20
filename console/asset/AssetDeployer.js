/**
 * @copyright Copyright (c) 2021 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const Base = require('./Asset');

module.exports = class AssetDeployer extends Base {

    getDefaultParams () {
        return Object.assign(super.getDefaultParams(), {
            targetDir: 'web'
        });
    }

    getTargetDir () {
        return this.params.targetDir;
    }

    async execute () {
        const data = this.params.deploy;
        if (data) {
            this.log('info', 'Deploying assets...');
            for (const key of Object.keys(data)) {
                await PromiseHelper.setTimeout(10);
                await this.deployModuleAssets(key, data[key]);
            }
        }
    }

    async deployModuleAssets (key, data) {
        const target = path.join(this.getTargetDir(), key);
        const files = typeof data === 'string' ? [data] : data;
        const modules = this.module.getOriginalHierarchy();
        for (const file of files) {
            let source = path.join(this.getAssetDir(), file);
            let done = false;
            for (const module of modules) {
                const sourceFile = module.getPath(source);
                const targetFile = module.getPath(target);
                if (await this.copyFile(sourceFile, targetFile)) {
                    done = module;
                }
            }
            this.logResult(done, key, file);
        }
    }

    async deployAssets (data, root) {
        for (const key of Object.keys(data)) {
            await PromiseHelper.setTimeout(10);
            await this.deployAsset(key, data[key], root);
        }
    }

    async deployAsset (key, data, root) {
        const source = path.join(root, this.getAssetDir());
        const target = path.join(root, this.getTargetDir(), key);
        const files = typeof data === 'string' ? [data] : data;
        for (const file of files) {
            const done = await this.copyFile(path.join(source, file), target);
            this.logResult(done, key, file);
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

    logResult (done, key, file) {
        done ? this.log('info', `Deployed ${file} to ${key}`)
             : this.log('error', `Not deployed ${file} to ${key}`);
    }
};

const FileHelper = require('areto/helper/FileHelper');
const PromiseHelper = require('areto/helper/PromiseHelper');
const path = require('path');