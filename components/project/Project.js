/**
 * @copyright Copyright (c) 2019 Maxim Khorin (maksimovichu@gmail.com)
 */
'use strict';

const Base = require('areto/base/Base');

module.exports = class Project extends Base {

    constructor (config) {
        super({
            'Configuration': require('./ProjectConfiguration'),
            ...config
        });
        this.id = this.name;
    }

    getPath (...args) {
        return this.projects.getPath.apply(this.projects, [this.id].concat(args));
    }

    require (file) {
        return typeof file === 'string' ? require(this.getPath(file)) : file;
    }

    getModuleParam (module, key, defaults) {
        return this.getConfig(`modules.${module}.params.${key}`, defaults);
    }

    getParam (key, defaults) {
        return ObjectHelper.getNestedValue(key, this.params, defaults);
    }

    getConfig (...args) {
        return this.config.get.apply(this.config, args);
    }

    async configure () {
        this.config = ClassHelper.createInstance(this.Configuration, {
            'name': this.projects.configName,
            'project': this
        });
        await this.config.load();
        this.params = this.getConfig('params');
    }

    log (type, message, data) {
        CommonHelper.log(type, message, data, this.id, this.projects.module);
    }

    logError (...args) {
        this.log.apply(this, ['error'].concat(args));
    }
};

const ClassHelper = require('areto/helper/ClassHelper');
const CommonHelper = require('areto/helper/CommonHelper');
const ObjectHelper = require('areto/helper/ObjectHelper');