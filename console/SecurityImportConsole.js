/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const Base = require('./SecurityConsole');

module.exports = class SecurityImportConsole extends Base {

    async execute () {
        const file = this.getDataFile();
        this.data = await FileHelper.readJsonFile(file);
        this.rbac = this.app.getRbac();
        this.store = this.rbac.store;
        this.key = this.store.key;
        if (this.params.clear) {
            await this.clearData();
        }
        await this.rbac.createByData(this.data);
        this.log('info', `Security imported: ${file}`);
    }

    getDataFile () {
        const file = this.params.file || 'default';
        return this.app.getPath('data/security', `${file}.json`);
    }

    async clearData () {
        await this.store.clearAll();
        const user = this.spawn('model/User');
        await user.getDb().truncate(user.getTable());
        const password = this.spawn('security/UserPassword');
        await password.getDb().truncate(password.getTable());
    }

    getUserItems () {
        return this.data.users || [];
    }
};

const FileHelper = require('areto/helper/FileHelper');