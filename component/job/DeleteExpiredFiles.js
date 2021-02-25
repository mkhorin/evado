/**
 * @copyright Copyright (c) 2020 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const Base = require('areto/scheduler/Job');

module.exports = class DeleteExpiredFiles extends Base {

    constructor (config) {
        super({
            lifetime: 'PT1H',
            ...config
        });
    }

    async execute () {
        await this.deleteFiles();
    }

    async deleteFiles () {
        const raw = this.spawn('model/RawFile');
        const files = await raw.findExpired(this.getEarliestValidCreationDate()).all();
        for (const file of files) {
            await file.delete();
        }
    }

    getEarliestValidCreationDate () {
        return new Date(Date.now() - DateHelper.parseDuration(this.lifetime));
    }
};

const DateHelper = require('areto/helper/DateHelper');