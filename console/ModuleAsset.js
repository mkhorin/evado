/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const Base = require('areto/base/Base');

module.exports = class ModuleAsset extends Base {

    async install () {
        const dir = this.module.getConfig('assets.source');
        if (typeof dir !== 'string') {
            return false;
        }
        if (this.module.origin) {
            await this.installSource(this.module.origin.getPath(dir));
        }
        await this.installSource(this.module.getPath(dir));
        for (let child of this.module.getModules()) {
            await this.console.createModuleAsset(child).install();
        }
    }

    async installSource (source) {
        if (source && await FileHelper.getStat(path.join(source, 'package.json'))) {
            this.log('info', `Source vendor folder: ${source}`);
            this.log('info', `Clear folder...`);
            await FileHelper.remove(path.join(source, 'node_modules'));
            this.log('info', `Install vendors...`);
            await SystemHelper.spawnProcess(source, 'npm', ['install']);
            await PromiseHelper.setImmediate();
        }
    }

    async deploy () {
        const params = this.module.getConfig('assets');
        if (!params) {
            return false;
        }
        const vendorTarget = this.module.getPath(params.target);

        this.log('info', `Web vendor folder: ${vendorTarget}`);
        await FileHelper.createDir(vendorTarget);

        this.log('info', `Clear folder...`);
        await FileHelper.emptyDir(vendorTarget);

        this.log('info', `Deploy assets...`);
        await this.deployVendors(params);
        await PromiseHelper.setImmediate();

        for (let child of this.module.getModules()) {
            await this.console.createModuleAsset(child).deploy();
        }
    }

    async deployVendors (params) {
        if (params.files) {
            for (let vendor of Object.keys(params.files)) {
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
        for (let name of files) {
            if (this.module.origin && await this.deployVendorFile(name, vendor, this.module.origin, params)) {
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
        source = module.getPath(source, 'node_modules', vendor, name);
        target = this.module.getPath(target, vendor, name);
        if (await FileHelper.getStat(source)) {
            await FileHelper.copy(source, target);
            this.log('info', `Deployed: ${vendor}/${name}`);
            return true;
        }
    }

    log (type, message) {
        this.console.log(type, `${this.module.NAME}: ${message}`);
    }
};

const path = require('path');
const FileHelper = require('areto/helper/FileHelper');
const PromiseHelper = require('areto/helper/PromiseHelper');
const SystemHelper = require('areto/helper/SystemHelper');