/**
 * @copyright Copyright (c) 2021 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const Base = require('areto/base/Base');

module.exports = class Packer extends Base {

    constructor (config) {
        super({
            extensions: ['.js'],
            shrinking: true,
            ...config
        });
        this.errors = [];
    }

    async execute () {
        let result = await this.mergeSources(this.sources);
        if (result === false) {
            return this.errors;
        }
        result = this.prepareContent(result);
        const target = path.join(this.targetRoot, this.target);
        await fs.promises.mkdir(path.dirname(target), {recursive: true});
        await fs.promises.writeFile(target, result, 'utf8');
    }

    async mergeSources (sources) {
        let result = '';
        this.processedSources = new DataMap;
        sources = typeof sources === 'string' ? [sources] : sources;
        for (const source of sources) {
            const content = await this.mergeSource(source);
            if (typeof content !== 'string') {
                return false;
            }
            result += content;
        }
        return result;
    }

    async mergeSource (source) {
        const file = path.join(this.sourceRoot, source);
        const stat = await FileHelper.getStat(file);
        if (!stat) {
            return this.addError(`Not found: ${file}`);
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
        text = Minifier.removeComments(text);
        return text;
    }

    addError () {
        this.errors.push(arguments);
    }

    log () {
        CommonHelper.log(this.module, this.constructor.name, ...arguments);
    }
};

const CommonHelper = require('areto/helper/CommonHelper');
const DataMap = require('areto/base/DataMap');
const FileHelper = require('areto/helper/FileHelper');
const Minifier = require('areto/web/packer/Minifier');
const fs = require('fs');
const path = require('path');