/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const Base = require('areto/base/Base');

module.exports = class FilePreview extends Base {

    constructor (config) {
        super({
            root: 'upload/preview',
            defaultSizeKey: 'small',
            mime: 'image/png',
            extension: 'png',
            PreviewSize: require('./PreviewSize'),
            ...config
        });
        this.root = this.resolvePath(this.root);
    }

    async init () {
        await this.createSizes();
    }

    async createSizes () {
        this.sizes = this.sizes || {};
        for (let key of Object.keys(this.sizes)) {
            this.sizes[key] = this.spawn({
                Class: this.PreviewSize,
                ...this.sizes[key]
            });
            await this.sizes[key].init();
        }
    }

    getSize (key) {
        return Object.prototype.hasOwnProperty.call(this.sizes, key) ? this.sizes[key] : null;
    }

    getHeaders (name) {
        return {
            'Content-Disposition': `inline; filename=${encodeURIComponent(`${name}.${this.extension}`)}`,
            'Content-Transfer-Encoding': 'binary',
            'Content-Type': this.mime
        };
    }

    getSizePath (key, filename) {
        return path.join(this.root, key, filename);
    }

    resolvePath (target) {
        return path.isAbsolute(target) ? target : this.module.getPath(target);
    }

    async ensureSize (key, filename, source) {
        if (!key || key === 'default') {
            key = this.defaultSizeKey;
        }
        const size = this.getSize(key);
        if (!size) {
            return null;
        }
        const file = this.getSizePath(key, filename);
        const stat = await FileHelper.getStat(file);
        if (stat || await this.processSize(key, filename, source)) {
            return file;
        }
    }

    async processAllSizes (filename, source) {
        for (let key of Object.keys(this.sizes)) {
            if (!await this.processSize(key, filename, source)) {
                return false;
            }
        }
    }

    async processSize (key, filename, source) {
        let image = sharp(source);
        let size = this.getSize(key);
        let file = this.getSizePath(key, filename);
        try {
            image = await size.process(image);
            await FileHelper.createDir(path.dirname(file));
            await image.toFile(file);
            return true;
        } catch (err) {
            this.module.logError(this.wrapClassMessage(`Creation failed: ${file}:`), err);
        }
    }

    async remove (filename) {
        for (let key of Object.keys(this.sizes)) {
            await FileHelper.remove(this.getSizePath(key, filename));
        }
    }
};

const path = require('path');
const sharp = require('sharp');
const FileHelper = require('areto/helper/FileHelper');