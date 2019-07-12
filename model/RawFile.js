/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const Base = require('areto/db/ActiveRecord');

module.exports = class RawFile extends Base {

    static getConstants () {
        return {
            TABLE: 'sys_rawFile',
            ATTRS: [
                'name',
                'mime',
                'size',
                'file',
                'createdAt',
                'creator', // [User]
                'owner', // [File]
                'hash'
            ],
            RULES: [
                ['file', 'required']
            ],
            BEHAVIORS: {
                'timestamp': {Class: require('areto/behavior/TimestampBehavior')},
                'userStamp': {Class: require('areto/behavior/UserStampBehavior')}
            }
        };
    }

    static getStorage (module) {
        return module.get('fileStorage');
    }

    isImage () {
        return this.get('mime').indexOf('image') === 0;
    }

    getStorage () {
        return this.constructor.getStorage(this.module);
    }

    getName () {
        return this.get('name');
    }

    getFilename () {
        return this.get('file');
    }

    getSize () {
        return this.get('size');
    }

    getMime () {
        return this.get('mime');
    }

    findPending (id, creator) {
        return this.findById(id).and({
            owner: null,
            creator: creator.getId()
        });
    }

    async upload (req, res) {
        let data = await this.getStorage().upload(req, res);
        if (!data) {
            return this.addError('file', 'Invalid upload');
        }
        this.setAttrs(data);
        this.set('file', { // for validation
            path: this.getStorage().getPath(data.filename),
            filename: data.filename,
            size: data.size,
            mime: data.mime || '',
            extension: data.extension
        });
        return this.save();
    }

    createValidators () {
        let validators = super.createValidators();
        let rule = this.getStorage().getValidatorRule('file'); // from storage config
        if (rule) {
            let validator = this.createValidator(rule);
            if (validator) {
                validators.push(validator);
            }
        }
        return validators;
    }

    async afterValidate () {
        this.set('file', this.get('file').filename);
        if (this.hasError()) {
            await this.getStorage().remove(this.getFilename());
        }
        await super.afterValidate();
    }

    async afterRemove () {
        if (!this.get('owner')) {
            await this.getStorage().remove(this.getFilename());
        }
        await super.afterRemove();
    }
};
module.exports.init(module);