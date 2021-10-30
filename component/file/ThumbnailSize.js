/**
 * @copyright Copyright (c) 2020 Maxim Khorin <maksimovichu@gmail.com>
 *
 * sharp.dimens.io/en/stable/api-resize
 * sharp.dimens.io/en/stable/api-output/#jpeg
 * sharp.dimens.io/en/stable/api-composite/#composite
 */
'use strict';

const Base = require('areto/base/Base');

module.exports = class ThumbnailSize extends Base {

    /**
     * @param {Object} config
     * @param {string} config.flatten - Merge alpha transparency channel
     * @param {Object[]} config.composite
     * @param {Object} config.composite[].input - Watermark path: asset/watermark/large.png
     * @param {Object} config.composite[].gravity - Watermark position: southeast
     */
    constructor (config) {
        super({
            width: 256,
            height: 256,
            resizeParams: {
                fit: 'inside',
                withoutEnlargement: true
            },
            output: 'jpeg',
            outputParams: {
                quality: 70
            },
            flatten: '#ffffff',
            ...config
        });
    }

    async init () {
        await this.resolveComposite();
    }

    async resolveComposite () {
        if (!this.composite) {
            return null;
        }
        this._minCompositeWidth = this.width;
        this._minCompositeHeight = this.height;
        try {
            for (const data of this.composite) {
                await this.resolveCompositeInput(data);
            }
        } catch (err) {
            this.log('error', `Composite failed:`, err);
            this.composite = null;
        }
    }

    async resolveCompositeInput (item) {
        if (typeof item.input !== 'string') {
            return null;
        }
        const sharp = require('sharp');
        item.input = this.module.getPath(item.input);
        const {width, height} = await sharp(item.input).metadata();
        if (width > this.width || height > this.height) {
            throw new Error(`Composite size exceeds thumbnail: ${item.input}`);
        }
        if (width < this._minCompositeWidth) {
            this._minCompositeWidth = width;
        }
        if (height < this._minCompositeHeight) {
            this._minCompositeHeight = height;
        }
    }

    getRelativePath (filename) {
        return `${this.width}x${this.height}/${filename}`;
    }

    async process (image) {
        image.resize(this.width, this.height, this.resizeParams);
        if (this.flatten) {
            image.flatten({background: this.flatten});
        }
        if (!this.composite) {
            return image[this.output](this.outputParams);
        }
        const {data, info} = await image.raw().toBuffer({
            resolveWithObject: true
        });
        const sharp = require('sharp');
        image = sharp(data, {raw: info}); // already resize
        image[this.output](this.outputParams);
        if (info.width < this._minCompositeWidth || info.height < this._minCompositeHeight) {
            this.log('warn', 'Composite skipped: Overlay is larger than background');
            return image;
        }
        return image.composite(this.composite);
    }

    keepAspectRatio (width, height, sourceWidth, sourceHeight) {
        sourceWidth = sourceWidth || 1;
        sourceHeight = sourceHeight || 1;
        const sourceRatio = sourceWidth / sourceHeight;
        const ratio = width / height;
        if (sourceRatio > ratio) {
            height = width / sourceRatio;
        } else {
            width = height * sourceRatio;
        }
        if (sourceWidth * height > width * sourceHeight) {
            height = (width * sourceHeight) / sourceWidth;
        } else {
            width = (height * sourceWidth) / sourceHeight;
        }
        return [width, height];
    }

    log () {
        CommonHelper.log(this.module, this.constructor.name, ...arguments);
    }
};

const CommonHelper = require('areto/helper/CommonHelper');