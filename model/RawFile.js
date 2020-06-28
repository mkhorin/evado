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
                'name',
                'mime',
                'size',
                'file',
                'createdAt',
                'creator',
                'owner'
            ],
            RULES: [
                ['file', 'required']
            ],
            BEHAVIORS: {
                'timestamp': {Class: require('areto/behavior/TimestampBehavior')},
                'userStamp': {Class: require('areto/behavior/UserStampBehavior')}
            },
            INDEXES: [
                [{owner: 1}, {unique: false}]
            ]
        };
    }

    isImage () {
        return this.get('mime').indexOf('image') === 0;
    }

    isSvg () {
        return this.get('mime').indexOf('image/svg+xml') === 0;
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

    getOwner () {
        return this.get('owner');
    }

    getTitle () {
        return this.get('name');
    }

    getStorage () {
        return this.module.get('fileStorage');
    }

    getPath () {
        return this.getStorage().getPath(this.getFilename());
    }

    getFileHeaders () {
        return this.getStorage().getHeaders(this.getName(), this.getMime());
    }

    getThumbnailHeaders () {
        return this.getStorage().thumbnail.getHeaders(this.getName());
    }

    findExpired (date) {
        return this.find().and({owner: null}, ['<', 'createdAt', date]);
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

    async isLimitReached (user) {
        const {maxTotalUserFileSize, maxTotalUserFiles} = this.getStorage();
        if (!maxTotalUserFileSize && !maxTotalUserFiles) {
            return false;
        }
        const sizes = await this.find({creator: user.getId()}).column('size');
        if (maxTotalUserFiles && sizes.length >= maxTotalUserFiles) {
            return true;
        }
        return maxTotalUserFileSize
            ? sizes.reduce((total, value) => total + value, 0) >= maxTotalUserFileSize
            : false;
    }

    async upload (req, res) {
        const data = await this.getStorage().upload(req, res);
        this.setAttrs(data);
        this.set('file', { // for validation
            path: this.getStorage().getPath(data.filename),
            filename: data.filename,
            size: data.size,
            mime: data.mime,
            extension: data.extension
        });
        return this.save();
    }

    createValidators () {
        const validators = super.createValidators();
        const rule = this.getStorage().getValidatorRule('file'); // from storage configuration
        if (rule) {
            const validator = this.createValidator(rule);
            if (validator) {
                validators.push(validator);
            }
        }
        return validators;
    }

    async afterValidate () {
        this.set('file', this.get('file').filename);
        if (this.hasError()) {
            await this.getStorage().delete(this.getFilename());
        }
        return super.afterValidate();
    }

    async afterDelete () {
        await this.getStorage().delete(this.getFilename());
        return super.afterDelete();
    }

    // RELATIONS

    relCreator () {
        const Class = this.getClass('model/User');
        return this.hasOne(Class, Class.PK, 'creator');
    }
};
module.exports.init(module);