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
        const modules = this.module.getOriginalHierarchy();
        for (const module of modules) {
            const {vendorDir} = this.getParams(module);
            if (typeof vendorDir === 'string') {
                const source = module.getPath(vendorDir);
                await this.installVendors(source);
            }
        }
    }

    async installVendors (dir) {
        const file = path.join(dir, 'package.json');
        const stat = await FileHelper.getStat(file);
        if (stat) {
            this.log('info', `Install asset vendors: ${dir}`);
            await SystemHelper.spawnProcess(dir, 'npm', ['install']);
        }
    }
};

const FileHelper = require('areto/helper/FileHelper');
const SystemHelper = require('areto/helper/SystemHelper');
const path = require('path');