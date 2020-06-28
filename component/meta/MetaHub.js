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
            basePath: 'meta/app',
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

    createDataFinder (items, params) {
        items = Array.isArray(items) ? items : items.split('.');
        const meta = this.get(items[0]);
        return meta ? meta.createDataFinder(items.slice(1), params) : null;
    }

    // LOAD

    async load () {
        this.moduleNames = this.module.modules.keys();
        this.loadErrors = [];
        this._logHandler = this.logLoadError;
        await this.models.load();
        this._logHandler = null;
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

    logLoadError (type, message) {
        if (type === 'error') {
            this.loadErrors.push(message);
        }
    }

    log () {
        if (this._logHandler) {
            this._logHandler.apply(this, arguments);
        }
        CommonHelper.log(this.module, 'META', ...arguments);
    }
};
module.exports.init();

const path = require('path');
const CommonHelper = require('areto/helper/CommonHelper');
const PromiseHelper = require('areto/helper/PromiseHelper');
const StringHelper = require('areto/helper/StringHelper');
const MetaHelper = require('../helper/MetaHelper');