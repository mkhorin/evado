/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const Base = require('areto/base/Component');

module.exports = class MetaHub extends Base {

    static getConstants () {
        return {
            EVENT_AFTER_LOAD: 'afterLoad'
        };
    }

    constructor (config) {
        super({
            basePath: 'meta',
            models: require('./MetaModels'),
            processing: {
                Class: require('./SingleProcessing'),
                busyMessage: 'Metadata updating in progress'
            },
            ...config
        });
        this.basePath = this.module.getPath(this.basePath);
        this.User = this.getClass('model/User');
    }

    init () {
        this.models = this.spawn(this.models, {hub: this});
        this.processing = this.spawn(this.processing, {owner: this});
    }

    get (name) {
        return this.models.get(name);
    }

    getDb () {
        return this.module.getDb();
    }

    getPath () {
        return path.join(this.basePath, ...arguments);
    }

    splitByModulePrefix (name) {
        return MetaHelper.splitByPrefix(name, '-', this.moduleNames);
    }

    log () {
        CommonHelper.log(this.module, 'META', ...arguments);
    }

    // LOAD

    onAfterLoad (handler) {
        this.on(this.EVENT_AFTER_LOAD, handler);
    }

    async load () {
        this.moduleNames = this.module.modules.keys();
        await this.models.load();
        await this.afterLoad();
    }

    async afterLoad () {
        await this.trigger(this.EVENT_AFTER_LOAD);
        await PromiseHelper.setImmediate();
    }

    async afterDataImport () {
        for (const model of this.models) {
            await model.afterDataImport();
        }
    }

    // PROCESSING

    isBusy () {
        return this.processing.isBusy();
    }

    reload () {
        return this.process(async ()=> {
            await this.models.load();
            await this.afterLoad();
            await PromiseHelper.setImmediate();
        });
    }

    process (handler) {
        return this.processing.execute(handler);
    }

};
module.exports.init();

const path = require('path');
const CommonHelper = require('areto/helper/CommonHelper');
const PromiseHelper = require('areto/helper/PromiseHelper');
const MetaHelper = require('../helper/MetaHelper');