/**
 * @copyright Copyright (c) 2021 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const Base = require('areto/base/Component');

module.exports = class S3Storage extends Base {

    /**
     * @param {Object} config
     * @param {number} config.downloadExpiryTime - Seconds
     * @param {number} config.uploadExpiryTime - Seconds
     * @param {number} config.maxTotalUserFileSize - Size in bytes
     * @param {number} config.maxTotalUserFiles
     */
    constructor (config) {
        super({
            endPoint: '127.0.0.1',
            port: 9000,
            useSSL: true,
            accessKey: '',
            secretKey: '',
            bucket: '',
            downloadExpiryTime: 3600,
            uploadExpiryTime: 3600,
            maxTotalUserFileSize: null,
            maxTotalUserFiles: null,
            ...config
        });
    }

    async init () {
        this.client = this.createClient();
    }

    isConnectionError (data) {
        return data?.code === 'ECONNREFUSED';
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
        const stat = await this.getFileStat(filename);
        return stat.hash;
    }

    getSignedDownloadUrl (filename, name) {
        return this.client.presignedGetObject(this.bucket, filename, this.downloadExpiryTime, {
            'response-content-disposition': `attachment; filename=${encodeURIComponent(name || filename)}`
        });
    }

    getSignedUploadUrl (filename) {
        return this.client.presignedPutObject(this.bucket, filename, this.uploadExpiryTime);
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
        const year = now.getFullYear();
        const month = ('0' + (now.getMonth() + 1)).slice(-2);
        const name = MongoHelper.createId();
        return `${year}-${month}/${name}`;
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