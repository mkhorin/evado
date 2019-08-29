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
            TaskConsole: require('./TaskConsole'),
            ...config
        });
        this.app = ClassHelper.spawn(this.Application);
        this.module = this.app;
    }

    start () {
        return this.execute(async ()=> await this.app.start());
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

    dropData (params) {
        return this.execute('drop', this.DataConsole, params);
    }

    importData (params) {
        return this.execute('execute', this.DataImportConsole, params);
    }

    exportData (params) {
        return this.execute('execute', this.DataExportConsole, params);
    }

    // INDEXES

    createIndexes (params) {
        return this.execute('create', this.IndexingConsole, params);
    }

    // SECURITY

    createUsers () {
        return this.execute('createUsers', this.SecurityConsole);
    }

    createRbac () {
        return this.execute('createRbac', this.SecurityConsole);
    }

    signUp (params) {
        return this.execute('signUp', this.SecurityConsole, params);
    }

    changePassword (params) {
        return this.execute('changePassword', this.SecurityConsole, params);
    }

    assignRole (params) {
        return this.execute('assignRole', this.SecurityConsole, params);
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
            await this.app.init();
            await handler();
            await this.logTotal();
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

    async logTotal () {
        await PromiseHelper.setTimeout(200); // skip previous console output
        const logger = this.app.get('logger');
        const counters = logger.getCounters(['error', 'warn']).map(item => `${item.type}: ${item.counter}`);
        if (counters.length) {
            this.log('warn', `Log total: ${counters.join(', ')}`);
        }
    }
};

const ClassHelper = require('areto/helper/ClassHelper');
const PromiseHelper = require('areto/helper/PromiseHelper');