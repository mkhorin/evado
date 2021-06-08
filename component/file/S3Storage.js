/**
 * @copyright Copyright (c) 2021 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const Base = require('areto/base/Component');

module.exports = class S3Storage extends Base {

    constructor (config) {
        super({
            endPoint: '127.0.0.1',
            port: 9000,
            useSSL: true,
            accessKey: '',
            secretKey: '',
            bucket: '',
            urlExpiryTime: 2 * 60 * 60,
            maxTotalUserFileSize: null, // 1000 * 1024 * 1024 // bytes
            maxTotalUserFiles: null, // 1000
            ...config
        });
    }

    async init () {
        this.client = this.createClient();
    }

    isThumbnails () {
        return false;
    }

    async getFileStat (filename) {
        const data = await this.client.statObject(this.bucket, filename);
        return {
            hash: data.etag,
            type: data.metaData['content-type'],
            size: data.size
        };
    }

    async getHash (filename) {
        return (await this.getFileStat(filename)).hash;
    }

    getSignedDownloadUrl (filename, name) {
        return this.client.presignedGetObject(this.bucket, filename, this.urlExpiryTime, {
            'response-content-disposition': `attachment; filename=${encodeURIComponent(name || filename)}`
        });
    }

    getSignedUploadUrl (filename) {
        return this.client.presignedPutObject(this.bucket, filename, this.urlExpiryTime);
    }

    createClient () {
        const Minio = require('minio');
        return new Minio.Client({
            endPoint: this.endPoint,
            port: this.port,
            useSSL: this.useSSL,
            accessKey: this.accessKey,
            secretKey: this.secretKey
        });
    }

    generateFilename () {
        const now = new Date;
        const month = ('0' + (now.getMonth() + 1)).slice(-2);
        return `${now.getFullYear()}-${month}/${MongoHelper.createObjectId()}`;
    }

    async deleteFile (filename) {
        await this.client.removeObject(this.bucket, filename);
    }

    async deleteAll () {
        const items = await this.client.listObjects(this.bucket);
        await this.client.removeObject(this.bucket, items);
    }
};

const MongoHelper = require('areto/helper/MongoHelper');