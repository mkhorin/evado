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
        const file = this.getFilename();
        return this.getStorage().getFileStat(file);
    }

    getSignedDownloadUrl () {
        const file = this.getFilename();
        const name = this.getName();
        return this.getStorage().getSignedDownloadUrl(file, name);
    }

    getSignedUploadUrl () {
        const file = this.getFilename();
        return this.getStorage().getSignedUploadUrl(file);
    }

    setData (data) {
        if (typeof data.name === 'string') {
            data.extension = FileHelper.getExtension(data.name);
        }
        this.setSafeAttrs(data);
        this.set('file', data);
    }

    addValidatorByRule (rule) {
        if (Array.isArray(rule)) {
            rule[2] = {skipOnAnyError: true, ...rule[2]};
        }
        super.addValidatorByRule(...arguments);
    }

    prepareFilename () {
        const file = this.getStorage().generateFilename();
        this.set('file', file);
    }

    deleteInvalidFile () {
        return null;
    }
};
module.exports.init(module);

const FileHelper = require('areto/helper/FileHelper');