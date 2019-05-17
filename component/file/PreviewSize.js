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
            // composite: [{}],
            ...config
        });
    }

    async init () {
        this.resolveCompositeInput();
    }

    resolveCompositeInput () {
        if (Array.isArray(this.composite)) {
            for (let data of this.composite) {
                if (typeof data.input === 'string') {
                    data.input = this.module.getPath(data.input);
                }
            }
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
        if (this.composite) {
            return sharp(await image.toBuffer()).composite(this.composite);
        }
        return image;
    }

    keepAspectRatio (width, height, sourceWidth, sourceHeight) {
        sourceWidth = sourceWidth || 1;
        sourceHeight = sourceHeight || 1;
        let sourceRatio = sourceWidth / sourceHeight;
        let ratio = width / height;
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