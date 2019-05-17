'use strict';

const Base = require('areto/db/ActiveRecord');

module.exports = class File extends Base {

    static getConstants () {
        return {
            TABLE: 'sys_file',
            ATTRS: [
                'name',
                'size',
                'mime',
                'file',
                'createdAt',
                'creator',
                'updatedAt',
                'editor',
                'hash'
            ],
            RULES: [
                ['file', 'required'],
                ['name', 'required', {on: 'update'}],
                ['name', 'string'],
                ['file', 'validateFile']
            ],
            BEHAVIORS: {
                'timestamp': {Class: require('areto/behavior/TimestampBehavior')},
                'userStamp': {Class: require('areto/behavior/UserStampBehavior')}
            }
        };
    }

    isFileExists () {
        return this.getStorage().isFileExists(this.getFilename());
    }

    isImage () {
        return this.get('mime').indexOf('image') === 0;
    }

    getStorage () {
        return this.module.get('fileStorage');
    }

    getTitle () {
        return this.get('name');
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

    getPath () {
        return this.getStorage().getPath(this.getFilename());
    }

    getFileHeaders () {
        return this.getStorage().getHeaders(this.getName(), this.getMime());
    }

    getPreviewHeaders () {
        return this.getStorage().preview.getHeaders(this.getName());
    }

    async validateFile (attr) {
        let value = this.get(attr);
        if (value === this.getOldAttr(attr)) {
            return true;
        }
        this.rawFile = await this.spawn(RawFile).findPending(value, this.user).one();
        if (!this.rawFile) {
            this.addError(attr, 'Not found raw file');
        }
    }

    ensurePreview (key) {
        return this.getStorage().ensurePreview(key, this.getFilename());
    }

    // EVENTS

    async beforeSave (insert) {
        await super.beforeSave(insert);
        this.assignRawData(this.rawFile);
    }

    assignRawData (rawFile) {
        if (rawFile) {
            this.setFromModel('file', rawFile);
            this.setFromModel('mime', rawFile);
            this.setFromModel('size', rawFile);
            this.setFromModel('hash', rawFile);
            if (!this.get('name')) {
                this.setFromModel('name', rawFile);
            }
        }
    }

    async afterSave (insert) {
        if (this.rawFile) {
            await this.rawFile.directUpdate({owner: this.getId()});
        }
        return super.afterSave(insert);
    }

    async afterUpdate () {
        if (this.rawFile) {
            await this.getStorage().remove(this.getOldAttr('file'));
        }
        return super.afterUpdate();
    }

    async afterRemove () {
        await this.getStorage().remove(this.getFilename());
        return super.afterRemove();
    }

    // RELATIONS

    relCreator () {
        return this.hasOne(User, User.PK, 'creator');
    }

    relEditor () {
        return this.hasOne(User, User.PK, 'editor');
    }
};
module.exports.init();

const RawFile = require('./RawFile');
const User = require('./User');