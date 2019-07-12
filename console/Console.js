/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const Base = require('areto/base/Base');

module.exports = class Console extends Base {

    constructor (config) {
        super({
            AssetConsole: require('./AssetConsole'),
            AuthConsole: require('./AuthConsole'),
            DataConsole: require('./DataConsole'),
            DataImportConsole: require('./DataImportConsole'),
            DataExportConsole: require('./DataExportConsole'),
            ...config
        });
        this.app = ClassHelper.spawn(this.Application);
    }

    async install () {
        await this.execute(async ()=> {
            await this.createHandler('install', this.AssetConsole)();
            await this.createHandler('deploy', this.AssetConsole)();
            await this.createHandler('createUsers', this.AuthConsole)();
            await this.createHandler('createRbac', this.AuthConsole)();
        });
    }

    async start () {
        await this.execute(async ()=> await this.app.start());
    }

    // ASSET

    async installAssets () {
        await this.execute(this.createHandler('install', this.AssetConsole));
    }

    async deployAssets () {
        await this.execute(this.createHandler('deploy', this.AssetConsole));
    }

    // AUTH

    async createUsers () {
        await this.execute(this.createHandler('createUsers', this.AuthConsole));
    }

    async createRbac () {
        await this.execute(this.createHandler('createRbac', this.AuthConsole));
    }

    async signUp (params) {
        await this.execute(this.createHandler('signUp', this.AuthConsole, params));
    }

    async changePassword (params) {
        await this.execute(this.createHandler('changePassword', this.AuthConsole, params));
    }

    async assignRole (params) {
        await this.execute(this.createHandler('assignRole', this.AuthConsole, params));
    }

    // DATA

    async dropData (params) {
        await this.execute(this.createHandler('drop', this.DataConsole, params));
    }

    async importData (params) {
        await this.execute(this.createHandler('execute', this.DataImportConsole, params));
    }

    async exportData (params) {
        await this.execute(this.createHandler('execute', this.DataExportConsole, params));
    }

    // HANDLER

    createHandler (method, config, params) {
        let instance = ClassHelper.spawn(config, {
            console: this,
            app: this.app,
            params
        });
        return instance[method].bind(instance);
    }

    async execute (handler) {
        try {
            await this.app.init();
            await handler();
            await this.logTotal();
        } catch (err) {
            this.log('error', err);
        }
    }

    // LOG

    log () {
        this.app.log(...arguments);
    }

    async logTotal () {
        await PromiseHelper.setTimeout(200); // skip previous console output
        let logger = this.app.get('logger');
        let total = logger.getTotal(['error', 'warn']).map(item => `${item.type}: ${item.counter}`);
        if (total.length) {
            this.log('warn', `Log total: ${total.join(', ')}`);
        }
    }
};

const ClassHelper = require('areto/helper/ClassHelper');
const PromiseHelper = require('areto/helper/PromiseHelper');