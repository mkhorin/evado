/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
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
                [['name', 'file'], 'required'],
                ['name', 'string'],
                ['file', 'validateFile']
            ],
            BEHAVIORS: {
                'timestamp': {Class: require('areto/behavior/TimestampBehavior')},
                'userStamp': {Class: require('areto/behavior/UserStampBehavior')}
            },
            ATTR_LABELS: {
                'mime': 'MIME type'
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
        this.rawFile = await this.spawn('model/RawFile').findPending(value, this.user).one();
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
        const Class = this.getClass('model/User');
        return this.hasOne(Class, Class.PK, 'creator');
    }

    relEditor () {
        const Class = this.getClass('model/User');
        return this.hasOne(Class, Class.PK, 'editor');
    }
};
module.exports.init(module);