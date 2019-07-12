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
            models: require('./MetaModels'),
            processing: {
                Class: require('./SingleProcessing'),
                busyMessage: 'Meta updating in progress'
            },
            ...config
        });
    }

    init () {
        this.models = this.spawn(this.models, {hub: this});
        this.processing = this.spawn(this.processing, {owner: this});
    }

    getMetaPath () {
        return this.module.getMetaPath(...arguments);
    }

    getDb () {
        return this.module.getDb();
    }

    getModel (name) {
        return this.models.get(name);
    }

    splitByModulePrefix (name) {
        return MetaHelper.splitByPrefix(name, '-', this.moduleNames);
    }

    log (type, message, data) {
        CommonHelper.log(type, message, data, 'META', this.module);
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
        for (let model of this.models) {
            await model.afterDataImport();
        }
    }

    async updateIndexes () {
        for (let model of this.models) {
            await model.updateIndexes();
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

const CommonHelper = require('areto/helper/CommonHelper');
const PromiseHelper = require('areto/helper/PromiseHelper');
const MetaHelper = require('../helper/MetaHelper');