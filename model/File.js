'use strict';

const Base = require('areto/db/ActiveRecord');

module.exports = class File extends Base {

    static getConstants () {
        return {
            TABLE: 'sys_file',
            ATTRS: [
                'author',
                'originalName',
                'fileName',
                'size',
                'mime',
                'hash',
                'createdAt'
            ],
            RULES: [
                ['file', 'required', {on: 'create'}],
                ['originalName', 'required'],
                ['originalName', 'string']
            ],
            BEHAVIORS: {
                'timestamp': {
                    Class: require('areto/behavior/TimestampBehavior'),
                    updatedAttr: false
                }
            },
            CONFIG: {
                storeDir: 'upload/file',
                thumbDir: 'upload/preview',
                thumbSizes: {
                    1: [256, 256]
                },
                thumbDefaultSize: 1,
                thumbResizeMethod: 'cropResizeImage',
                thumbMime: 'image/jpeg',
                thumbExtension: 'jpg',
                quality: 50,
                rule: {
                    maxSize: 10000000
                }
            }
        };
    }

    static init (module) {
        super.init(module);
        this.module.on(this.module.EVENT_AFTER_INIT, this.initConfig.bind(this));
    }

    static initConfig () {
        AssignHelper.deepAssign(this.CONFIG, this.module.getConfig('upload'));
        this.CONFIG.storeDir = path.resolve(this.module.getPath(), this.CONFIG.storeDir);
        this.CONFIG.thumbDir = path.resolve(this.module.getPath(), this.CONFIG.thumbDir);
        this.RULES.push(['file', 'file', this.CONFIG.rule]);
    }

    isImage () {
        let mime = this.get('mime');
        return mime && mime.indexOf('image') === 0;
    }

    getTitle () {
        return this.get('originalName');
    }

    getSize () {
        return this.get('size');
    }

    getOriginalName () {
        return this.get('originalName');
    }

    getMime () {
        return this.get('mime');
    }

    getPath () {
        return path.join(this.CONFIG.storeDir, this.get('fileName'));
    }

    getFileHeaders () {
        return {
            'Content-Disposition': `attachment; filename=${encodeURIComponent(this.getOriginalName())}`,
            'Content-Transfer-Encoding': 'binary',
            'Content-Type': this.getMime()
        };
    }
    getThumbHeaders () {
        let name = `${this.getOriginalName()}.${this.CONFIG.thumbExtension}`;
        return {
            'Content-Disposition': `inline; filename=${encodeURIComponent(name)}`,
            'Content-Transfer-Encoding': 'binary',
            'Content-Type': this.CONFIG.thumbMime
        };
    }

    async upload () {
        this.subDir = this.generateSubDir();
        let uploader = this.createSingleUploader();
        await PromiseHelper.promise(uploader.bind(this, this.req, this.res));
        if (this.req.file) {
            this.populateFileStats(this.req.file);
            this.set('file', this.getFileStats()); // for validate
        }
    }

    createSingleUploader () {
        return multer({
            'storage': this.createUploaderStorage()
        }).single('file');
    }

    createUploaderStorage () {
        return multer.diskStorage({
            'destination': this.generateStoreDir.bind(this),
            'filename': this.generateFilename.bind(this)
        });
    }

    generateStoreDir (req, file, callback) {
        let dir = path.join(this.CONFIG.storeDir, this.subDir);
        mkdirp(dir, err => callback(err, dir));
    }

    generateSubDir () { // split by months
        let now = new Date;
        return now.getFullYear() +'-'+ ('0' + (now.getMonth() + 1)).slice(-2);
    }

    generateFileName (req, file, callback) {
        callback(null, Date.now().toString() + CommonHelper.getRandom(11, 99));
    }

    populateFileStats (file) {
        this.setAttrs({
            'fileName': path.join(this.subDir, file.filename),
            'originalName': file.originalname,
            'size': file.size,
            'mime': file.mimetype,
            'extension': path.extname(file.originalname).substring(1).toLowerCase()
        });
    }

    getFileStats () {
        return {
            'path': this.getPath(),
            'originalName': this.getOriginalName(),
            'size': this.getSize(),
            'mime': this.getMime(),
            'extension': this.get('extension')
        };
    }

    toJSON () {
        return {
            'id': this.getId(),
            'name': this.getOriginalName(),
            'size': this.getSize(),
            'isImage': this.isImage(),
            'createdAt': this.get('createdAt')
        };
    }

    isFileExists () {
        try {
            fs.accessSync(this.getPath(), fs.constants.R_OK);
            return true;
        } catch (err) {}
    }

    // EVENTS

    async beforeValidate () {
        await super.beforeValidate();
        await this.upload();
    }

    async afterValidate () {
        if (this.hasError()) {
            fs.unlinkSync(this.getPath());
        }
        await super.afterValidate();
    }

    /*async afterSave (insert) {
        await this.generateThumbs();
        await super.afterSave(insert);
    }//*/

    async afterRemove () {
        await super.afterRemove();
        this.removeThumbs();
        fs.unlinkSync(this.getPath());                
    }

    // RELATIONS

    relAuthor () {
        return this.hasOne(User, User.PK, 'author');
    }

    // THUMBS

    getThumbPath (size) {
        return path.join(this.CONFIG.thumbDir, this.getThumbName(size));
    }

    getThumbName (size) {
        return `${size[0]}x${size[1]}/${this.get('fileName')}`;
    }

    async ensureThumb (key) {
        if (!this.CONFIG.thumbSizes.hasOwnProperty(key)) {
            key = this.CONFIG.thumbDefaultSize;
        }
        let size = this.CONFIG.thumbSizes[key];
        if (!size) {
            throw new Error(this.wrapClassMessage('No thumbnail'));
        }
        if (!this.isImage()) {
            throw new Error(this.wrapClassMessage('Not image'));
        }
        let thumbPath = this.getThumbPath(size);
        try {
            fs.accessSync(thumbPath);            
        } catch (err) {            
            await this.generateThumb(gm(this.getPath()), key);
        }
        return thumbPath;
    }

    async generateThumbs () {
        if (this.CONFIG.thumbSizes && this.isImage()) {
            let image = gm(this.getPath());
            for (let key of Object.keys(this.CONFIG.thumbSizes)) {
                await this.generateThumb(image, key);
            }
        }
    }

    async generateThumb (image, key) {        
        let size = this.CONFIG.thumbSizes[key];
        let thumbPath = this.getThumbPath(size);
        image.resize(size[0], size[1]);
        // image.resize(size[0], size[1], '!'); // to override the image's proportions           
        await this.setWatermark(image, key);
        mkdirp.sync(path.dirname(this.getThumbPath(size)));
        image.quality(this.quality);
        await PromiseHelper.promise(image.write.bind(image, thumbPath));
    }

    setWatermark (image, key) {
        if (this.CONFIG.watermark && this.CONFIG.watermark.hasOwnProperty(key)) {
            image.draw([`image Over 0,0 0,0 ${this.CONFIG.watermark[key]}`]);
        }        
    }

    removeThumbs () {
        if (this.CONFIG.thumbSizes && this.isImage()) {
            for (let size of Object.values(this.CONFIG.thumbSizes)) {
                try {
                    fs.unlinkSync(this.getThumbPath(size));
                } catch (err) {}
            }
        }
    }
};
module.exports.init(module);

const fs = require('fs');
const gm = require('gm');
const multer = require('multer');
const mkdirp = require('mkdirp');
const path = require('path');
const PromiseHelper = require('areto/helper/PromiseHelper');
const CommonHelper = require('areto/helper/CommonHelper');
const AssignHelper = require('areto/helper/AssignHelper');
const User = require('./User');