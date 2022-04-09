/**
 * @copyright Copyright (c) 2020 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const Base = require('areto/db/ActiveRecord');

module.exports = class RawFile extends Base {

    static getConstants () {
        return {
            TABLE: 'sys_rawFile',
            ATTRS: [
                'file',
                'name',
                'size',
                'type',
                'createdAt',
                'creator',
                'owner'
            ],
            RULES: [
                ['file', 'required'],
                ['file', 'validator/UploadLimitValidator']
            ],
            BEHAVIORS: {
                'timestamp': {
                    Class: require('areto/behavior/TimestampBehavior')
                },
                'userStamp': {
                    Class: require('areto/behavior/UserStampBehavior')
                }
            },
            INDEXES: [
                [{owner: 1}, {unique: false}]
            ],
            ATTR_LABELS: {
                type: 'Media type'
            },
            STORAGE: 'fileStorage'
        };
    }

    isImage () {
        return this.get('type')?.indexOf('image') === 0;
    }

    isSvg () {
        return this.get('type')?.indexOf('image/svg+xml') === 0;
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

    getMediaType () {
        return this.get('type');
    }

    getOwner () {
        return this.get('owner');
    }

    getTitle () {
        return this.get('name');
    }

    getStorage () {
        return this.module.get(this.STORAGE);
    }

    getPath () {
        return this.getStorage().getPath(this.getFilename());
    }

    getFileHeaders () {
        return this.getStorage().getHeaders(this.getName(), this.getMediaType());
    }

    getThumbnailHeaders () {
        return this.getStorage().thumbnail.getHeaders(this.getName());
    }

    findExpired (date) {
        return this.find({owner: null}, ['<', 'createdAt', date]);
    }

    findPending (id, creator) {
        return this.findById(id).and({
            owner: null,
            creator: creator.getId()
        });
    }

    ensureThumbnail (key) {
        return this.getStorage().ensureThumbnail(key, this.getFilename());
    }

    async upload (req, res) {
        const storage = this.getStorage();
        const data = await storage.upload(req, res);
        if (!data) {
            return this.addError('file', 'File not found');
        }
        data.path = storage.getPath(data.filename);
        this.setAttrs(data);
        this.set('file', data);
        return this.save();
    }

    createValidators () {
        const validators = super.createValidators();
        this.createFileValidators(validators);
        return validators;
    }

    createFileValidators (validators) {
        this.addValidatorByRule(this.getStorage().rule, validators);
        this.addValidatorByRule(this.customRule, validators);
    }

    addValidatorByRule (rule, validators) {
        if (rule) {
            const validator = this.createValidator(rule);
            if (validator) {
                validators.push(validator);
            }
        }
    }

    async afterValidate () {
        this.prepareFilename();
        await this.deleteInvalidFile();
        return super.afterValidate();
    }

    prepareFilename () {
        this.set('file', this.get('file').filename);
    }

    deleteInvalidFile () {
        return this.hasError() ? this.deleteFile() : null;
    }

    async afterDelete () {
        try {
            await this.deleteFile();
        } catch (err) {
            this.log('error', err);
        }
        return super.afterDelete();
    }

    deleteFile () {
        return this.getStorage().deleteFile(this.getFilename());
    }

    // RELATIONS

    relCreator () {
        const Class = this.getClass('model/User');
        return this.hasOne(Class, Class.PK, 'creator');
    }
};
module.exports.init(module);