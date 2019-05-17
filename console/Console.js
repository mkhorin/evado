'use strict';

const Base = require('areto/base/Base');

module.exports = class Console extends Base {

    constructor (config) {
        super({
            'AssetConsole': require('./AssetConsole'),
            'AuthConsole': require('./AuthConsole'),
            'DataConsole': require('./DataConsole'),
            'DataImportConsole': require('./DataImportConsole'),
            'DataExportConsole': require('./DataExportConsole'),
            ...config
        });
        this.app = ClassHelper.spawn(this.Application);
    }

    async start () {
        await this.execute(async ()=> await this.app.start());
    }

    // ASSETS

    async installAssets () {
        await this.finalExecute(this.createHandler('install', this.AssetConsole));
    }

    async deployAssets () {
        await this.finalExecute(this.createHandler('deploy', this.AssetConsole));
    }

    // AUTH

    async createUsers () {
        await this.finalExecute(this.createHandler('createUsers', this.AuthConsole));
    }

    async createRbac () {
        await this.finalExecute(this.createHandler('createRbac', this.AuthConsole));
    }

    async signUp (params) {
        await this.finalExecute(this.createHandler('signUp', this.AuthConsole, params));
    }

    async changePassword (params) {
        await this.finalExecute(this.createHandler('changePassword', this.AuthConsole, params));
    }

    async assignRole (params) {
        await this.finalExecute(this.createHandler('assignRole', this.AuthConsole, params));
    }

    // DATA

    async dropData (params) {
        await this.finalExecute(this.createHandler('drop', this.DataConsole, params));
    }

    async importData (params) {
        await this.finalExecute(this.createHandler('execute', this.DataImportConsole, params));
    }

    async exportData (params) {
        await this.finalExecute(this.createHandler('execute', this.DataExportConsole, params));
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

    async finalExecute (handler) {
        await this.execute(handler);
        process.exit();
    }

    async execute (handler) {
        try {
            await this.app.init();
            await handler();
            await this.logTotal();
        } catch (err) {
            this.app.log('error', err);
            process.exit();
        }
    }

    // LOG

    async logTotal () {
        await PromiseHelper.delay(100); // after previous console output
        let logger = this.app.get('logger');
        let total = logger.getTotal(['error', 'warn']).map(item => `${item.type}: ${item.counter}`);
        if (total.length) {
            this.log('warn', `Log total: ${total.join(', ')}`);
        }
    }

    log (...args) {
        this.app.log(...args);
    }
};

const ClassHelper = require('areto/helper/ClassHelper');
const PromiseHelper = require('areto/helper/PromiseHelper');
