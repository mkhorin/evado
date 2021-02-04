/**
 * @copyright Copyright (c) 2021 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const Base = require('./Asset');

module.exports = class AssetDeploy extends Base {

    getDefaultParams () {
        return Object.assign(super.getDefaultParams(), {
            targetDir: 'web'
        });
    }

    async execute () {
        const data = this.params.deploy;
        if (data) {
            this.log('info', 'Deploying assets...');
            for (const key of Object.keys(data)) {
                await PromiseHelper.setTimeout(10);
                await this.deployAsset(key, data[key]);
            }
        }
    }

    async deployAsset (key, data) {
        const target = path.join(this.params.targetDir, key);
        const files = typeof data === 'string' ? [data] : data;
        const modules = this.module.getOriginalHierarchy();
        for (const file of files) {
            let source = path.join(this.getAssetDir(), file);
            let done = false;
            for (const module of modules) {
                if (await this.copyFile(source, target, module)) {
                    done = module;
                }
            }
            done ? this.log('info', `Deployed: ${target}`)
                 : this.log('error', `Not deployed: ${key}: ${file}`);
        }
    }

    async copyFile (source, target, sourceModule) {
        try {
            target = sourceModule.getPath(target);
            source = sourceModule.getPath(source);
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

const path = require('path');
const FileHelper = require('areto/helper/FileHelper');
const PromiseHelper = require('areto/helper/PromiseHelper');