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
            AuthConsole: require('./AuthConsole'),
            DataConsole: require('./DataConsole'),
            DataImportConsole: require('./DataImportConsole'),
            DataExportConsole: require('./DataExportConsole'),
            IndexConsole: require('./IndexConsole'),
            ...config
        });
        this.app = ClassHelper.spawn(this.Application);
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

    // AUTH

    createUsers () {
        return this.execute('createUsers', this.AuthConsole);
    }

    createRbac () {
        return this.execute('createRbac', this.AuthConsole);
    }

    signUp (params) {
        return this.execute('signUp', this.AuthConsole, params);
    }

    changePassword (params) {
        return this.execute('changePassword', this.AuthConsole, params);
    }

    assignRole (params) {
        return this.execute('assignRole', this.AuthConsole, params);
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

    // INDEX

    createIndexes (params) {
        return this.execute('create', this.IndexConsole, params);
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
        const instance = ClassHelper.spawn(config, {
            console: this,
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
        const total = logger.getTotal(['error', 'warn']).map(item => `${item.type}: ${item.counter}`);
        if (total.length) {
            this.log('warn', `Log total: ${total.join(', ')}`);
        }
    }
};

const ClassHelper = require('areto/helper/ClassHelper');
const PromiseHelper = require('areto/helper/PromiseHelper');