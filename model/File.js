/**
 * @copyright Copyright (c) 2020 Maxim Khorin <maksimovichu@gmail.com>
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
                'type',
                'file',
                'hash',
                'createdAt',
                'creator',
                'updatedAt',
                'editor'
            ],
            RULES: [
                [['name', 'file'], 'required'],
                ['name', 'string'],
                ['file', 'validateFile']
            ],
            BEHAVIORS: {
                'timestamp': {
                    Class: require('areto/behavior/TimestampBehavior')
                },
                'userStamp': {
                    Class: require('areto/behavior/UserStampBehavior')
                }
            },
            ATTR_LABELS: {
                type: 'Media type'
            }
        };
    }

    isFileExists () {
        return this.getStorage().isFileExists(this.getFilename());
    }

    isImage () {
        return this.get('type').indexOf('image') === 0;
    }

    isSvg () {
        return this.get('type').indexOf('image/svg+xml') === 0;
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

    getHash () {
        return this.get('hash');
    }

    getSize () {
        return this.get('size');
    }

    getMediaType () {
        return this.get('type');
    }

    getStorage () {
        return this.module.getFileStorage();
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

    getRawClass () {
        return this.getClass('model/RawFile');
    }

    assignRawData (rawFile) {
        if (rawFile) {
            this.setFromModel('file', rawFile);
            this.setFromModel('hash', rawFile);
            this.setFromModel('type', rawFile);
            this.setFromModel('size', rawFile);
            if (!this.get('name')) {
                this.setFromModel('name', rawFile);
            }
        }
    }

    async deleteRawFile () {
        const RawClass = this.getRawClass();
        const query = this.spawn(RawClass).find({
            owner: this.getId()
        });
        const models = await query.all();
        return RawClass.delete(models);
    }

    calculateHash () {
        return this.getStorage().getHash(this.getFilename());
    }

    ensureThumbnail (key) {
        return this.getStorage().ensureThumbnail(key, this.getFilename());
    }

    async validateFile (attr) {
        const value = this.get(attr);
        if (value === this.getOldAttr(attr)) {
            return true;
        }
        const model = this.spawn(this.getRawClass());
        const query = model.findPending(value, this.user);
        this.rawFile = await query.one();
        if (!this.rawFile) {
            this.addError(attr, 'Raw file not found');
        }
    }

    // EVENTS

    async beforeSave (insert) {
        await super.beforeSave(insert);
        this.assignRawData(this.rawFile);
    }

    async afterInsert () {
        if (this.rawFile) {
            await this.rawFile.directUpdate({
                owner: this.getId()
            });
        }
        return super.afterInsert();
    }

    async afterUpdate () {
        if (this.rawFile) {
            await this.deleteRawFile(); // delete current raw
            await this.rawFile.directUpdate({ // bind a new one
                owner: this.getId()
            });
        }
        return super.afterUpdate();
    }

    async afterDelete () {
        await this.deleteRawFile();
        return super.afterDelete();
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