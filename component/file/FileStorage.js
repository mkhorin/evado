/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const Base = require('./BaseFileStorage');

module.exports = class FileStorage extends Base {

    constructor (config) {
        super({
            basePath: 'upload/file',
            // maxTotalSize: 100 * 1024 * 1024,
            // maxTotalFiles: 100,
            ...config
        });
        this.basePath = this.resolvePath(this.basePath);
        this.uploader = this.spawn({
            Class: require('./Uploader'),
            basePath: this.basePath,
            ...this.uploader
        });
        this.thumbnail = this.spawn({
            Class: require('./Thumbnail'),
            ...this.thumbnail
        });
    }

    async init () {
        await this.thumbnail.init();
    }

    isFileExists (filename) {
        return FileHelper.getStat(this.getPath(filename));
    }

    hasThumbnail () {
        return Object.values(this.thumbnail.sizes).length > 0;
    }

    getPath (filename) {
        return path.join(this.basePath, filename);
    }

    ensureThumbnail (key, filename) {
        return this.thumbnail.ensureSize(key, filename, this.getPath(filename));
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

    async delete (filename) {
        if (filename && typeof filename === 'string') {
            await FileHelper.delete(this.getPath(filename));
            await this.thumbnail.delete(filename);
        }
    }

    async deleteAll () {
        await this.thumbnail.deleteAll();
        await FileHelper.delete(this.basePath);
    }
};
module.exports.init();

const path = require('path');
const FileHelper = require('areto/helper/FileHelper');