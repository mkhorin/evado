/**
 * @copyright Copyright (c) 2020 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const Base = require('areto/base/Base');

module.exports = class Thumbnail extends Base {

    constructor (config) {
        super({
            basePath: 'upload/thumbnail',
            defaultSizeKey: 'sm',
            type: 'image/png',
            extension: 'png',
            ThumbnailSize: require('./ThumbnailSize'),
            ...config
        });
        this.basePath = this.resolvePath(this.basePath);
    }

    async init () {
        await this.createSizes();
    }

    hasSizes () {
        return Object.values(this.sizes).length > 0;
    }

    getHeaders (name) {
        const uri = encodeURIComponent(`${name}.${this.extension}`);
        return {
            'Content-Disposition': `inline; filename=${uri}`,
            'Content-Transfer-Encoding': 'binary',
            'Content-Type': this.type
        };
    }

    getSize (key) {
        return Object.hasOwn(this.sizes, key)
            ? this.sizes[key]
            : null;
    }

    getSizePath (key, filename) {
        return path.join(this.basePath, key, filename);
    }

    async createSizes () {
        this.sizes = this.sizes || {};
        for (const key of Object.keys(this.sizes)) {
            this.sizes[key] = this.spawn({
                Class: this.ThumbnailSize,
                ...this.sizes[key]
            });
            await this.sizes[key].init();
        }
    }

    resolvePath (target) {
        return path.isAbsolute(target)
            ? target
            : this.module.getPath(target);
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
        for (const key of Object.keys(this.sizes)) {
            if (!await this.processSize(key, filename, source)) {
                return false;
            }
        }
    }

    async processSize (key, filename, source) {
        let sharp = require('sharp');
        let image = sharp(source);
        let size = this.getSize(key);
        let file = this.getSizePath(key, filename);
        try {
            image = await size.process(image);
            await FileHelper.createDirectory(path.dirname(file));
            await image.toFile(file);
            return true;
        } catch (err) {
            this.log('error', `Creation failed: ${file}:`, err);
        }
    }

    async delete (filename) {
        for (const key of Object.keys(this.sizes)) {
            const file = this.getSizePath(key, filename);
            await FileHelper.delete(file);
        }
    }

    deleteAll () {
        return FileHelper.delete(this.basePath);
    }

    deleteSize (key) {
        if (!this.getSize(key)) {
            return false;
        }
        const file = path.join(this.basePath, key);
        return FileHelper.delete(file);
    }

    log () {
        CommonHelper.log(this.module, this.constructor.name, ...arguments);
    }
};

const CommonHelper = require('areto/helper/CommonHelper');
const FileHelper = require('areto/helper/FileHelper');
const path = require('path');