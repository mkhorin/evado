/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const Base = require('areto/base/Base');

module.exports = class AssetConsole extends Base {

    async install () {
        let dir = this.app.getConfig('assets.source');
        await this.installSource(this.app.origin.getPath(dir));
        await this.installSource(this.app.getPath(dir));
        this.log('info', 'Vendors installed. Need to deploy assets to publish');
    }

    async installSource (source) {
        if (await FileHelper.getStat(path.join(source, 'package.json'))) {
            this.log('info', `Source vendor folder: ${source}`);
            this.log('info', `Clear folder...`);
            await FileHelper.remove(path.join(source, 'node_modules'));
            this.log('info', `Install vendors...`);
            await SystemHelper.spawnProcess(source, 'npm', ['install']);
            await PromiseHelper.setImmediate();
        }
    }

    // DEPLOY

    async deploy () {
        let params = this.app.getConfig('assets');
        let vendorTarget = this.app.getPath(params.target);
        this.log('info', `Target vendor folder: ${vendorTarget}`);
        await FileHelper.createDir(vendorTarget);

        this.log('info', `Clear folder...`);
        await FileHelper.emptyDir(vendorTarget);

        this.log('info', `Deploy assets...`);
        await this.deployVendors(params);

        this.log('info', 'Assets deployed');
        await PromiseHelper.setImmediate();
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
            if (await this.deployVendorFile(name, vendor, this.app.origin, params)) {
                deployed = true;
            }
            if (await this.deployVendorFile(name, vendor, this.app, params)) {
                deployed = true;
            }
        }
        if (!deployed) {
            this.log('error', `Not deployed: ${vendor}`);
        }
    }

    async deployVendorFile (name, vendor, module, {source, target}) {
        source = module.getPath(source, 'node_modules', vendor, name);
        target = this.app.getPath(target, vendor, name);
        if (await FileHelper.getStat(source)) {
            await FileHelper.copy(source, target);
            this.log('info', `Deployed: ${vendor}/${name}`);
            return true;
        }
    }

    log () {
        this.console.log(...arguments);
    }
};

const path = require('path');
const FileHelper = require('areto/helper/FileHelper');
const PromiseHelper = require('areto/helper/PromiseHelper');
const SystemHelper = require('areto/helper/SystemHelper');