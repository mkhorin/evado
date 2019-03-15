/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const Base = require('areto/base/Base');

module.exports = class ProjectConfiguration extends Base {

    constructor (config) {
        super({
            ...config
        });
    }

    get (key, defaults) {
        return this._config.get(key, defaults);
    }

    getModuleParam (module, key, defaults) {
        return this._moduleConfig[module] instanceof Configuration
            ? this._moduleConfig[module].get(key, defaults)
            : defaults;
    }

    getPath (...args) {
        return this.project.getPath.apply(this.project, args.push('config'));
    }

    async load () {
        this._config = this.createConfig(this.getPath());
        this._config.load();
        this._moduleConfig = {};
        await FileHelper.handleChildDirs(this.getPath('module'), async name => {
            let config = this.createConfig(this.getPath('module', name, 'config'));
            config.load();
            this._moduleConfig[name] = config;
        });
    }

    createConfig (dir) {
        return new Configuration({
            'dir': dir,
            'name': this.name
        });
    }
};

const FileHelper = require('areto/helper/FileHelper');
const Configuration = require('areto/base/Configuration');
