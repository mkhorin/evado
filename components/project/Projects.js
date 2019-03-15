/**
 * @copyright Copyright (c) 2019 Maxim Khorin (maksimovichu@gmail.com)
 */
'use strict';

const Base = require('areto/base/Base');

module.exports = class Projects extends Base {

    constructor (config) {
        super({
            'Project': require('./Project'),
            'root': 'project',
            'configName': config.module.configName,
            ...config
        });
    }

    isActive (name) {
        return !Array.isArray(this.activeProjects) || this.activeProjects.includes(name);
    }

    get (name) {
        return this._projects.get(name);
    }

    getPath (...args) {
        return this.getPath.apply(this, [this.root].concat(args));
    }

    async create () {
        this._projects = new DataMap;
        await FileHelper.handleChildDirs(this.getPath(), async name => {
            this.createProject(name);
            await this.get(name).configure();
        });
    }

    createProject (name) {
        this._projects.set(name, ClassHelper.createInstance(this.Project, {
            'name': name,
            'projects': this
        }));
    }
};

const ClassHelper = require('areto/helper/ClassHelper');
const FileHelper = require('areto/helper/FileHelper');
const DataMap = require('areto/base/DataMap');