/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const Base = require('areto/base/Base');

module.exports = class Uploader extends Base {

    constructor (config) {
        super({
            basePath: '/',
            fileAttr: 'file',
            ...config
        });
    }

    async execute (req, res) {
        const dir = this.generateDirectory();
        const upload = this.createSingleMulter(dir);
        await PromiseHelper.promise(upload, this, req, res);
        return req.file
            ? this.getFileStat(req.file, dir)
            : null;
    }

    getFileStat (file, dir) {
        return {
            name: file.originalname,
            filename: `${dir}/${file.filename}`,
            size: file.size,
            type: file.mimetype || '',
            extension: path.extname(file.originalname).substring(1).toLowerCase()
        };
    }

    createSingleMulter (dir) {
        return multer({
            storage: multer.diskStorage({
                destination: this.generateDestination.bind(this, dir),
                filename: this.generateFilename.bind(this)
            })
        }).single(this.fileAttr);
    }

    /**
     * Generate directory name by months
     */
    generateDirectory () {
        const now = new Date;
        return now.getFullYear() + '-' + ('0' + (now.getMonth() + 1)).slice(-2);
    }

    generateDestination (dir, req, file, callback) {
        dir = path.join(this.basePath, dir);
        fs.mkdir(dir, {recursive: true}, err => callback(err, dir));
    }

    generateFilename (req, file, callback) {
        callback(null, MongoHelper.createObjectId().toString());
    }
};

const MongoHelper = require('areto/helper/MongoHelper');
const PromiseHelper = require('areto/helper/PromiseHelper');
const fs = require('fs');
const multer = require('multer');
const path = require('path');