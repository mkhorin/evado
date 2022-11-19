/**
 * @copyright Copyright (c) 2020 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const Base = require('areto/scheduler/Job');

module.exports = class DeleteExpiredFiles extends Base {

    /**
     * @param {Object} config
     * @param {number} config.lifetime - Seconds or ISO_8601#Duration
     * @param {Array} config.models - File models
     */
    constructor (config) {
        super({
            lifetime: 'PT2H',
            models: [
                'model/RawFile',
                'model/S3File'
            ],
            ...config
        });
    }

    async execute () {
        await this.deleteFiles();
    }

    async deleteFiles () {
        for (const model of this.models) {
            await this.deleteModelFiles(model);
        }
    }

    async deleteModelFiles (config) {
        const model = this.spawn(config);
        const date = this.getEarliestValidCreationDate();
        const files = await model.findExpired(date).all();
        for (const file of files) {
            await file.delete();
        }
    }

    getEarliestValidCreationDate () {
        return new Date(Date.now() - DateHelper.parseDuration(this.lifetime));
    }
};

const DateHelper = require('areto/helper/DateHelper');