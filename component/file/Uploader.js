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
        const storage = multer.diskStorage({
            destination: this.generateDestination.bind(this, dir),
            filename: this.generateFilename.bind(this)
        });
        const instance = multer({storage});
        return instance.single(this.fileAttr);
    }

    /**
     * Generate directory name by date
     */
    generateDirectory () {
        const now = new Date;
        const year = now.getFullYear();
        const month = ('0' + (now.getMonth() + 1)).slice(-2);
        return `${year}-${month}`;
    }

    generateDestination (dir, req, file, callback) {
        const destination = path.join(this.basePath, dir);
        fs.mkdir(destination, {recursive: true}, err => callback(err, destination));
    }

    generateFilename (req, file, callback) {
        const filename = MongoHelper.createId().toString();
        callback(null, filename);
    }
};

const MongoHelper = require('areto/helper/MongoHelper');
const PromiseHelper = require('areto/helper/PromiseHelper');
const fs = require('fs');
const multer = require('multer');
const path = require('path');