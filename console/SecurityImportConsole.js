/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const Base = require('./SecurityConsole');

module.exports = class SecurityImportConsole extends Base {

    async execute () {
        const file = this.getDataFile();
        this.data = await FileHelper.readJsonFile(file);
        if (this.params.clear) {
            await this.clear();
        }
        if (this.params.users) {
            await this.createUsers();
        }
        await this.getRbac().createByData(this.data);
        this.log('info', `Security imported: ${file}`);
    }

    getDataFile () {
        const file = this.params.file || 'default';
        return this.app.getPath('data/security', `${file}.json`);
    }

    getUserItems () {
        return this.data.users || [];
    }
};

const FileHelper = require('areto/helper/FileHelper');