/**
 * @copyright Copyright (c) 2020 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const Base = require('areto/base/Base');

module.exports = class BaseModelConsole extends Base {

    async create () {
        await this.createModuleModels(this.app);
        this.log('info', 'Done');
    }

    async createModuleModels (module) {
        await this.createByData(module.getConfig(this.key), module);
        for (const child of module.getModules()) {
            await this.createModuleModels(child);
        }
    }

    async createByData (data, module) {
        if (data) {
            for (const name of Object.keys(data)) {
                await this.createModel(name, data[name], module);
            }
        }
    }

    async saveModel (model, name) {
        await model.save()
            ? this.log('info', `Model created: ${name}`)
            : this.log('error', `Invalid model: ${name}:`, model.getFirstErrorMap());
    }

    log () {
        CommonHelper.log(this.owner, this.constructor.name, ...arguments);
    }
};

const CommonHelper = require('areto/helper/CommonHelper');