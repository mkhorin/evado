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
            basePath: 'metadata/app',
            models: require('./MetaModels'),
            processing: {
                Class: require('./SingleProcessing'),
                busyMessage: 'Metadata updating in progress'
            },
            ...config
        });
        this.basePath = this.module.getPath(this.basePath);
        this.User = this.getClass('model/User');
        this.logger = this.spawn(MetaLogger, {meta: this});
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

    createDataFinder (items, params) {
        items = Array.isArray(items) ? items : items.split('.');
        const meta = this.get(items[0]);
        return meta ? meta.createDataFinder(items.slice(1), params) : null;
    }

    // LOAD

    async load () {
        this.logger.clearErrors();
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

    onAfterLoad (handler) {
        this.on(this.EVENT_AFTER_LOAD, handler);
    }

    // PROCESSING

    isBusy () {
        return this.processing.isBusy();
    }

    reload () {
        return this.process(async ()=> {
            await this.load();
            await PromiseHelper.setImmediate();
        }, 'reload');
    }

    process () {
        return this.processing.execute(...arguments);
    }

    // LOG

    log () {
        this.logger.log(...arguments);
    }
};
module.exports.init();

const path = require('path');
const PromiseHelper = require('areto/helper/PromiseHelper');
const MetaLogger = require('./MetaLogger');
const MetaHelper = require('../helper/MetaHelper');