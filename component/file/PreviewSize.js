/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const Base = require('areto/base/Base');

module.exports = class PreviewSize extends Base {

    // sharp.dimens.io/en/stable/api-resize
    // sharp.dimens.io/en/stable/api-output/#jpeg
    // sharp.dimens.io/en/stable/api-composite/#composite

    constructor (config) {
        super({
            width: 256,
            height: 256,
            resizeParams: {
                fit: 'inside',
                withoutEnlargement: true
            },
            output: 'jpeg',
            outputParams: {quality: 70},
            flatten: '#ffffff', // merge alpha transparency channel
            // composite: [{
            //  input: 'asset/watermark/large.png',
            //  gravity: 'southeast'
            // }],
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
            for (let data of this.composite) {
                await this.resolveCompositeInput(data);
            }
        } catch (err) {
            this.module.logError(this.wrapClassMessage(`Composite failed:`), err);
            this.composite = null;
        }
    }

    async resolveCompositeInput (item) {
        if (typeof item.input !== 'string') {
            return null;
        }
        item.input = this.module.getPath(item.input);
        let {width, height} = await sharp(item.input).metadata();
        if (width > this.width || height > this.height) {
            throw new Error(`Composite size exceeds preview: ${item.input}`);
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
        image[this.output](this.outputParams);
        if (!this.composite) {
            return image;
        }
        const result = sharp(await image.toBuffer());
        const {width, height} = await result.metadata();
        if (width < this._minCompositeWidth || height < this._minCompositeHeight) {
            return image;
        }
        return result.composite(this.composite);
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
};

const sharp = require('sharp');