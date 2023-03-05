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

    async getFileStat (file) {
        const data = await this.client.statObject(this.bucket, file);
        return {
            hash: data.etag,
            type: data.metaData['content-type'],
            size: data.size
        };
    }

    async getHash (file) {
        const stat = await this.getFileStat(file);
        return stat.hash;
    }

    getSignedDownloadUrl (file, name) {
        const uri = encodeURIComponent(name || file);
        return this.client.presignedGetObject(this.bucket, file, this.downloadExpiryTime, {
            'response-content-disposition': `attachment; filename=${uri}`
        });
    }

    getSignedUploadUrl (file) {
        return this.client.presignedPutObject(this.bucket, file, this.uploadExpiryTime);
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

    async deleteFile (file) {
        await this.client.removeObject(this.bucket, file);
    }

    async deleteAll () {
        const items = await this.client.listObjects(this.bucket);
        await this.client.removeObject(this.bucket, items);
    }
};

const MongoHelper = require('areto/helper/MongoHelper');