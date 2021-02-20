/**
 * @copyright Copyright (c) 2021 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const Base = require('areto/base/Base');

module.exports = class FileMerger extends Base {

    constructor (config) {
        super({
            extensions: ['.js'],
            logging: false,
            shrinking: true,
            ...config
        });
    }

    async execute () {
        let result = '';
        this.processedSources = new DataMap;
        const sources = typeof this.sources === 'string' ? [this.sources] : this.sources;
        for (const source of sources) {
            const content = await this.mergeSource(source);
            if (typeof content !== 'string') {
                return false;
            }
            result += content;
        }
        result = this.prepareContent(result);
        const target = path.join(this.assetDir, this.target);
        await fs.promises.mkdir(path.dirname(target), {recursive: true});
        await fs.promises.writeFile(target, result, 'utf8');
        return true;
    }

    async mergeSource (source) {
        const file = path.join(this.assetDir, source);
        const stat = await FileHelper.getStat(file);
        if (!stat) {
            this.log('error', `File not found: ${file}`);
            return false;
        }
        return stat.isDirectory()
            ? await this.resolveSourceDirectory(file)
            : await this.resolveSourceFile(file);
    }

    async resolveSourceDirectory (dir) {
        let result = '';
        let names = await fs.promises.readdir(dir);
        for (const name of names) {
            const file = path.join(dir, name);
            const stat = await fs.promises.stat(file);
            result += stat.isDirectory()
                ? await this.resolveSourceDirectory(file)
                : await this.resolveSourceFile(file);
        }
        return result;
    }

    resolveSourceFile (file) {
        if (this.processedSources.has(file) || !this.extensions.includes(path.extname(file))) {
            return '';
        }
        this.processedSources.set(file, true);
        return fs.promises.readFile(file, 'utf8');
    }

    prepareContent (text) {
        if (this.shrinking) {
            text = this.shrink(text);
        }
        if (this.copyright) {
            text = this.copyright + text;
        }
        return text;
    }

    shrink (text) {
        return this.spawn({Class: Minifier, ... this.shrinking}).execute(text);
    }

    log () {
        if (this.logging) {
            CommonHelper.log(this.module, this.constructor.name, ...arguments);
        }
    }
};

const CommonHelper = require('areto/helper/CommonHelper');
const DataMap = require('areto/base/DataMap');
const FileHelper = require('areto/helper/FileHelper');
const Minifier = require('areto/web/packer/Minifier');
const fs = require('fs');
const path = require('path');