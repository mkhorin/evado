/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const Base = require('areto/base/Base');

module.exports = class Console extends Base {

    constructor (config) {
        super({
            params: {},
            AssetConsole: require('./AssetConsole'),
            DataConsole: require('./DataConsole'),
            DataImportConsole: require('./DataImportConsole'),
            DataExportConsole: require('./DataExportConsole'),
            IndexingConsole: require('./IndexingConsole'),
            SecurityConsole: require('./SecurityConsole'),
            SecurityExportConsole: require('./SecurityExportConsole'),
            SecurityImportConsole: require('./SecurityImportConsole'),
            TaskConsole: require('./TaskConsole'),
            ...config
        });
        this.app = this.app || ClassHelper.spawn(this.Application);
        this.module = this.app;
    }

    clearDatabase () {
        return this.app.getDb().dropAll();
    }

    startApp () {
        return this.execute(() => this.app.start());
    }

    // ASSET

    installAssets () {
        return this.execute('install', this.AssetConsole);
    }

    deployAssets () {
        return this.execute('deploy', this.AssetConsole);
    }

    // META

    dropMeta (params) {
        return this.execute('drop', this.MetaConsole, params);
    }

    importMeta (params) {
        return this.execute('import', this.MetaConsole, params);
    }

    // DATA

    clearData (params) {
        return this.execute('clear', this.DataConsole, params);
    }

    exportData (params) {
        return this.execute('execute', this.DataExportConsole, params);
    }

    importData (params) {
        return this.execute('execute', this.DataImportConsole, params);
    }

    // INDEXES

    createIndexes (params) {
        return this.execute('create', this.IndexingConsole, params);
    }

    // SECURITY

    createUsers () {
        return this.execute('createUsers', this.SecurityConsole);
    }

    createUser (params) {
        return this.execute('createUser', this.SecurityConsole, params);
    }

    createSecurity () {
        return this.execute('createSecurity', this.SecurityConsole);
    }

    changePassword (params) {
        return this.execute('changePassword', this.SecurityConsole, params);
    }

    assignRole (params) {
        return this.execute('assignRole', this.SecurityConsole, params);
    }

    exportSecurity (params) {
        return this.execute('execute', this.SecurityExportConsole, params);
    }

    importSecurity (params) {
        return this.execute('execute', this.SecurityImportConsole, params);
    }

    // TASKS

    createTasks (params) {
        return this.execute('create', this.TaskConsole, params);
    }

    // EXECUTE

    async execute (handler) {
        try {
            if (typeof handler === 'string') {
                handler = this.createHandler(...arguments);
            }
            if (this._appReady) {
                await handler();
            } else {
                await this.app.init();
                this._appReady = true;
                await handler();
                await this.logResult();
            }
        } catch (err) {
            this.log('error', err);
        }
    }

    createHandler (method, config, params) {
        const instance = this.spawn(config, {
            owner: this,
            app: this.app,
            params
        });
        return instance[method].bind(instance);
    }

    // LOG

    log () {
        this.app.log(...arguments);
    }

    async logResult () {
        await PromiseHelper.setTimeout(200); // skip previous console output
        const logger = this.app.get('logger');
        const counters = logger.getCounters(['error', 'warn']).map(item => `${item.type}: ${item.counter}`);
        if (counters.length) {
            this.log('warn', `Logging result: ${counters.join(', ')}`);
        }
    }
};

const ClassHelper = require('areto/helper/ClassHelper');
const PromiseHelper = require('areto/helper/PromiseHelper');