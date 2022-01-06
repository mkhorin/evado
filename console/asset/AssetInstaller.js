/**
 * @copyright Copyright (c) 2021 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const Base = require('./Asset');

module.exports = class AssetInstaller extends Base {

    getDefaultParams () {
        return Object.assign(super.getDefaultParams(), {
            vendorDir: 'asset/vendor'
        });
    }

    getVendorDir () {
        return this.params.vendorDir;
    }

    async execute () {
        for (const module of this.module.getOriginalHierarchy()) {
            const dir = this.getParams(module).vendorDir;
            if (typeof dir === 'string') {
                await this.installVendors(module.getPath(dir));
            }
        }
    }

    async installVendors (dir) {
        if (await FileHelper.getStat(path.join(dir, 'package.json'))) {
            this.log('info', `Install vendors: ${dir}`);
            await SystemHelper.spawnProcess(dir, 'npm', ['install']);
        }
    }
};

const FileHelper = require('areto/helper/FileHelper');
const SystemHelper = require('areto/helper/SystemHelper');
const path = require('path');