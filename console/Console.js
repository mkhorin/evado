/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const Base = require('areto/base/Base');

module.exports = class Console extends Base {

    static parseProcessArguments () {
        return SystemHelper.parseArguments(process.argv);
    }

    constructor (config) {
        super({
            AssetConsole: require('./AssetConsole'),
            DataConsole: require('./DataConsole'),
            DataImportConsole: require('./DataImportConsole'),
            DataExportConsole: require('./DataExportConsole'),
            EventHandlerConsole: require('./EventHandlerConsole'),
            IndexingConsole: require('./IndexingConsole'),
            ListenerConsole: require('./ListenerConsole'),
            NotificationConsole: require('./NotificationConsole'),
            SecurityConsole: require('./SecurityConsole'),
            SecurityExportConsole: require('./SecurityExportConsole'),
            SecurityImportConsole: require('./SecurityImportConsole'),
            TaskConsole: require('./TaskConsole'),
            UserFilterConsole: require('./UserFilterConsole'),
            ...config
        });
        this.params = this.params || {};
        this.app = this.app || this.createApplication();
        this.module = this.app;
    }
    
    createApplication () {
        return ClassHelper.spawn(this.Application, {
            configName: this.params.config,
            serverPort: this.params.port
        });
    }

    async clearAll () {
        await this.clearDatabase();
        await this.clearFiles();
    }

    clearDatabase () {
        return this.app.getDb().dropAll();
    }

    clearFiles () {
        return this.execute('deleteFiles', this.DataConsole);
    }

    async installApp (handler) {
        await this.execute(handler);
        this.log('info', 'Installation completed');
    }

    startApp () {
        return this.execute(() => this.app.start());
    }

    // ASSET

    installAssets (params) {
        return params.skipAssets
            ? this.log('info', 'Asset installation skipped')
            : this.execute('install', this.AssetConsole, params);
    }

    buildAssets (params) {
        return params.skipAssets
            ? this.log('info', 'Asset building skipped')
            : this.execute('build', this.AssetConsole, params);
    }

    deployAssets (params) {
        return params.skipAssets
            ? this.log('info', 'Asset deployment skipped')
            : this.execute('deploy', this.AssetConsole, params);
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

    importDataFiles (params) {
        return this.execute('importFiles', this.DataImportConsole, params);
    }

    // EVENT HANDLERS

    createEventHandlers (params) {
        return this.execute('create', this.EventHandlerConsole, params);
    }

    // INDEXES

    createIndexes (params) {
        return this.execute('create', this.IndexingConsole, params);
    }

    // LISTENERS

    createListeners (params) {
        return this.execute('create', this.ListenerConsole, params);
    }

    // NOTIFICATIONS

    createNotifications (params) {
        return this.execute('create', this.NotificationConsole, params);
    }

    // SECURITY

    createUsers () {
        return this.execute('createUsers', this.SecurityConsole);
    }

    createUser (params) {
        return this.execute('createUser', this.SecurityConsole, params);
    }

    updateUser (params) {
        return this.execute('updateUser', this.SecurityConsole, params);
    }

    changePassword (params) {
        return this.execute('changePassword', this.SecurityConsole, params);
    }

    createSecurity () {
        return this.execute('createSecurity', this.SecurityConsole);
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

    clearSecurity (params) {
        return this.execute('clear', this.SecurityConsole, params);
    }

    // TASKS

    createTasks (params) {
        return this.execute('create', this.TaskConsole, params);
    }

    // USER FILTERS

    createUserFilters (params) {
        return this.execute('create', this.UserFilterConsole, params);
    }

    // MODULES

    async importStudioData () {
        const studio = this.app.getModule('studio');
        this.log('info', 'Clearing studio data...');
        await studio.dropAll();
        this.log('info', 'Importing studio data...');
        await studio.importMeta();
        this.log('info', 'Studio data imported');
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
            this.log('error', 'Execution failed', err);
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

    resolveUsers (names) {
        names = Array.isArray(names) ? names : [];
        return names.length
            ? this.spawn('model/User').findByName(names).ids()
            : names;
    }

    stringifyData (data) {
        return data && typeof data !== 'string' ? JSON.stringify(data) : data;
    }

    // LOG

    async logResult () {
        await PromiseHelper.setTimeout(250); // wait for previous console output
        const logger = this.app.get('logger');
        const counters = logger.getCounters(['error', 'warn']).map(item => `${item.type}: ${item.counter}`);
        if (counters.length) {
            this.log('warn', `Logging result: ${counters.join(', ')}`);
        }
    }

    log () {
        CommonHelper.log(this.app, this.constructor.name, ...arguments);
    }
};

const ClassHelper = require('areto/helper/ClassHelper');
const CommonHelper = require('areto/helper/CommonHelper');
const PromiseHelper = require('areto/helper/PromiseHelper');
const SystemHelper = require('areto/helper/SystemHelper');