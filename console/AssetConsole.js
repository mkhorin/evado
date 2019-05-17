'use strict';

const Base = require('areto/base/Base');

module.exports = class AssetConsole extends Base {

    async install () {
        let source = this.app.origin.getPath(this.app.getConfig('assets.source'));
        this.log('info', `Clear install folder...`);

        await FileHelper.remove(path.join(source, 'node_modules'));
        this.log('info', `Start asset installation...`);

        await SystemHelper.spawnProcess(source, 'npm', ['install']);
        this.log('info', 'Assets are installed. Need to deploy assets to publish');
    }

    async deploy () {
        let params = this.app.getConfig('assets');
        let vendorTarget = this.app.getPath(params.target);
        await FileHelper.createDir(vendorTarget);
        await FileHelper.emptyDir(vendorTarget);
        await this.deployVendors(params);
        this.log('info', 'Assets are deployed');
    }

    // VENDOR

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
            let source = this.app.origin.getPath(params.source, 'node_modules', vendor, name);
            let target = this.app.getPath(params.target, vendor, name);
            if (await FileHelper.getStat(source)) {
                await FileHelper.copy(source, target);
                this.log('info', `Deployed: ${vendor}/${name}`);
                deployed = true;
            }
        }
        if (!deployed) {
            this.log('error', `Not deployed: ${vendor}`);
        }
    }

    log (...args) {
        this.console.log(...args);
    }
};

const path = require('path');
const FileHelper = require('areto/helper/FileHelper');
const SystemHelper = require('areto/helper/SystemHelper');