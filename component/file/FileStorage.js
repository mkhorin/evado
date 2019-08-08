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
        this.preview = this.spawn({
            Class: require('./FilePreview'),
            ...this.preview
        });
        this.uploader = this.spawn({
            Class: require('./Uploader'),
            basePath: this.basePath,
            ...this.uploader
        });
    }

    async init () {
        await this.preview.init();
    }

    isFileExists (filename) {
        return FileHelper.getStat(this.getPath(filename));
    }

    getPath (filename) {
        return path.join(this.basePath, filename);
    }

    ensurePreview (key, filename) {
        return this.preview.ensureSize(key, filename, this.getPath(filename));
    }

    async remove (filename) {
        if (filename && typeof filename === 'string') {
            await FileHelper.remove(this.getPath(filename));
            await this.preview.remove(filename);
        }
    }
};
module.exports.init();

const path = require('path');
const FileHelper = require('areto/helper/FileHelper');