/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const Base = require('areto/base/Configuration');

module.exports = class ModuleConfiguration extends Base {

    constructor (config) {
        super(config);
        this.projectRoot = this.module.app.getProjectPath();
    }

    get (key, defaults) {
        return this._config.get(key, defaults);
    }

    getTitle () {
        return this._config.getTitle();
    }

    includesIfArray (key, value) {
        return this._config.includesIfArray(key, value);
    }

    async load () {
        this._config = this.createConfig(this.dir);
        this._config.load();
        if (!this.get('params.ignoreProjectConfiguration')) {
            await FileHelper.handleChildDirs(this.projectRoot, project => {
                this.createProjectConfig(project);
            });
        }
    }

    createProjectConfig (project) {
        let config = this.createConfig(this.getProjectPath(project));
        config.load();
        this._config.deepAssign(config.get('module'));
    }

    createConfig (dir) {
        return new Configuration({
            'dir': dir,
            'name': this.name
        });
    }

    getProjectPath (project) {
        let configDir = FileHelper.getRelativePath(this.dir, path.dirname(this.module.app.CLASS_FILE));
        return path.join(this.projectRoot, project, configDir);
    }
};

const path = require('path');
const FileHelper = require('areto/helper/FileHelper');
const Configuration = require('areto/base/Configuration');