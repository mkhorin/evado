/**
 * @copyright Copyright (c) 2021 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const Base = require('./RawFile');

module.exports = class S3File extends Base {

    static getConstants () {
        return {
            TABLE: 'sys_s3File',
            RULES: [
                [['name', 'type', 'size'], 'required'],
                [['name', 'type'], 'string', {max: 1024}],
                ['size', 'integer', {min: 1}],
                ['file', 'validator/UploadLimitValidator', {skipOnAnyError: true}]
            ],
            STORAGE: 's3Storage'
        };
    }

    async isEqualStat () {
        const {size} = await this.getFileStat();
        return this.get('size') === size;
    }

    getFileStat () {
        return this.getStorage().getFileStat(this.getFilename());
    }

    getSignedDownloadUrl () {
        return this.getStorage().getSignedDownloadUrl(this.getFilename(), this.getName());
    }

    getSignedUploadUrl () {
        return this.getStorage().getSignedUploadUrl(this.getFilename());
    }

    async upload (data) {
        if (typeof data.name === 'string') {
            data.extension = FileHelper.getExtension(data.name);
        }
        this.setSafeAttrs(data);
        this.set('file', data);
        return this.save();
    }

    addValidatorByRule (rule) {
        if (Array.isArray(rule)) {
            rule[2] = {skipOnAnyError: true, ...rule[2]};
        }
        super.addValidatorByRule(...arguments);
    }

    prepareFilename () {
        this.set('file', this.getStorage().generateFilename());
    }

    deleteInvalidFile () {
        return null;
    }
};
module.exports.init(module);

const FileHelper = require('areto/helper/FileHelper');