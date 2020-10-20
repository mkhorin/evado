/**
 * @copyright Copyright (c) 2020 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const Base = require('areto/base/Base');

module.exports = class ModuleAsset extends Base {

    constructor (config) {
        super(config);
        this.params = this.getParams();
    }

    getParams () {
        const params = this.module.getConfig('assets');
        return params ? Object.assign(this.getDefaultParams(), params) : null;
    }

    getDefaultParams () {
        return {
            source: 'asset/vendor',
            target: 'web/vendor',
            defaults: {
                base: ['dist', 'min', 'build']
            },
            defaultBase: 'base'
        };
    }

    async install () {
        const dir = this.params && this.params.source;
        if (typeof dir !== 'string') {
            return false;
        }
        if (this.module.original) {
            await this.installSource(this.module.original.getPath(dir));
        }
        await this.installSource(this.module.getPath(dir));
    }

    async installSource (source) {
        if (source && await FileHelper.getStat(path.join(source, 'package.json'))) {
            this.log('info', `Source vendor folder: ${source}`);
            this.log('info', `Clear folder...`);
            await FileHelper.delete(path.join(source, 'node_modules'));
            this.log('info', `Install vendors...`);
            await SystemHelper.spawnProcess(source, 'npm', ['install']);
            await PromiseHelper.setImmediate();
        }
    }

    async deploy () {
        if (!this.params) {
            return false;
        }
        const vendorTarget = this.module.getPath(this.params.target);
        this.log('info', `Web vendor folder: ${vendorTarget}`);
        await FileHelper.createDirectory(vendorTarget);
        this.log('info', `Clear folder...`);
        await FileHelper.emptyDirectory(vendorTarget);
        this.log('info', `Deploy assets...`);
        await this.deployVendors(this.params);
        await PromiseHelper.setImmediate();
    }

    async deployVendors (params) {
        if (params.files) {
            for (const vendor of Object.keys(params.files)) {
                await this.deployVendor(vendor, params.files[vendor], params);
            }
        }
    }

    async deployVendor (vendor, files, params) {
        if (files === true) {
            files = params.defaultBase;
        }
        if (typeof files === 'string') {
            files = params.defaults[files] || [];
        }
        let deployed = false;
        for (const name of files) {
            const original = this.module.original;
            if (original && await this.deployVendorFile(name, vendor, original, params)) {
                deployed = true;
            }
            if (await this.deployVendorFile(name, vendor, this.module, params)) {
                deployed = true;
            }
        }
        if (!deployed) {
            this.log('error', `Not deployed: ${vendor}`);
        }
    }

    async deployVendorFile (name, vendor, module, {source, target}) {
        const sourceName = Array.isArray(name) ? name[0] : name;
        const targetName = Array.isArray(name) ? name[1] : name;
        source = module.getPath(source, 'node_modules', vendor, sourceName);
        target = this.module.getPath(target, vendor, targetName);
        if (await FileHelper.getStat(source)) {
            await FileHelper.copy(source, target);
            this.log('info', `Deployed: ${vendor}/${sourceName}`);
            return true;
        }
    }

    log () {
        this.module.log(...arguments);
    }
};

const path = require('path');
const FileHelper = require('areto/helper/FileHelper');
const PromiseHelper = require('areto/helper/PromiseHelper');
const SystemHelper = require('areto/helper/SystemHelper');