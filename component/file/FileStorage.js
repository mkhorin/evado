/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const Base = require('areto/base/Component');

module.exports = class FileStorage extends Base {

    static getHeaders (name, type) {
        return {
            'Content-Disposition': `attachment; filename=${encodeURIComponent(name)}`,
            'Content-Transfer-Encoding': 'binary',
            'Content-Type': type
        };
    }

    /**
     * @param {Object} config
     * @param {number} config.maxTotalUserFileSize - Size in bytes
     * @param {number} config.maxTotalUserFiles
     */
    constructor (config) {
        super({
            basePath: 'upload/file',
            hashingAlgorithm: 'md5',
            maxTotalUserFileSize: null,
            maxTotalUserFiles: null,
            ...config
        });
        this.basePath = this.resolvePath(this.basePath);
        this.uploader = this.spawnUploader(this.uploader);
        this.thumbnail = this.spawnThumbnail(this.thumbnail);
    }

    async init () {
        await this.thumbnail.init();
    }

    isFileExists (filename) {
        const file = this.getPath(filename);
        return FileHelper.getStat(file);
    }

    isThumbnails () {
        return this.thumbnail.hasSizes();
    }

    spawnThumbnail (config) {
        return this.spawn({
            Class: require('./Thumbnail'),
            ...config
        });
    }

    spawnUploader (config) {
        return this.spawn({
            Class: require('./Uploader'),
            basePath: this.basePath,
            ...config
        });
    }

    getHash (filename) {
        const file = this.getPath(filename);
        return SecurityHelper.hashFile(file, this.hashingAlgorithm);
    }

    getHeaders () {
        return this.constructor.getHeaders(...arguments);
    }

    getPath (filename) {
        return path.join(this.basePath, filename);
    }

    resolvePath (target) {
        return path.isAbsolute(target)
            ? target
            : this.module.getPath(target);
    }

    upload () {
        return this.uploader.execute(...arguments);
    }

    ensureThumbnail (key, filename) {
        const file = this.getPath(filename);
        return this.thumbnail.ensureSize(key, filename, file);
    }

    async copyTo (destination) {
        if (await FileHelper.getStat(this.basePath)) {
            await FileHelper.copyChildren(this.basePath, destination);
        }
    }

    async copyFrom (source) {
        await this.thumbnail.deleteAll();
        if (await FileHelper.getStat(source)) {
            await FileHelper.copyChildren(source, this.basePath);
        }
    }

    async deleteFile (filename) {
        const file = this.getPath(filename);
        await FileHelper.delete(file);
        await this.thumbnail.delete(filename);
    }

    async deleteAll () {
        await this.thumbnail.deleteAll();
        await FileHelper.delete(this.basePath);
    }
};
module.exports.init();

const FileHelper = require('areto/helper/FileHelper');
const SecurityHelper = require('areto/helper/SecurityHelper');
const path = require('path');