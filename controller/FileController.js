/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const Base = require('../component/base/BaseController');

module.exports = class FileController extends Base {

    static getConstants () {
        return {
           BEHAVIORS: {
                'access': {
                    Class: require('areto/filter/AccessControl'),
                    rules: [{
                        actions: ['upload', 'delete'],
                        permissions: ['appUpload']
                    }]
                }
            },
            METHODS: {
                'upload': 'post',
                'delete': 'post'
            }
        };
    }

    async actionUpload () {
        const model = this.spawn('model/RawFile');
        if (!await model.validateUserLimit(this.user)) {
            const message = this.translate(model.getFirstError());
            return this.sendText(message, Response.CONFLICT);
        }
        if (!await model.upload(this.req, this.res)) {
            const message = this.translate(model.getFirstError());
            return this.sendText(message, Response.BAD_REQUEST);
        }
        this.sendJson({
            id: model.getId(),
            type: model.getMediaType(),
            size: model.getSize()
        });
    }

    async actionDelete () {
        const {id} = this.getPostParams();
        const query = this.spawn('model/RawFile').findById(id);
        const model = await query.one();
        if (!model) {
            return this.sendStatus(Response.NOT_FOUND);
        }
        if (model.getOwner()) {
            return this.sendStatus(Response.BAD_REQUEST);
        }
        await model.delete();
        this.sendStatus(Response.OK);
    }

    async actionDownload () {
        const model = await this.getModel();
        const file = model.getPath();
        const stat = await FileHelper.getStat(file);
        if (!stat) {
            model.log('error', 'File not found');
            return this.sendStatus(Response.NOT_FOUND);
        }
        const headers = model.getFileHeaders();
        this.setHttpHeader(headers);
        this.sendFile(file);
    }

    async actionThumbnail () {
        const model = await this.getModel();
        const {s: size} = this.getQueryParams();
        const file = await model.ensureThumbnail(size);
        if (!file) {
            return this.sendStatus(Response.NOT_FOUND);
        }
        const headers = model.getThumbnailHeaders();
        this.setHttpHeader(headers);
        this.sendFile(file);
    }
};
module.exports.init(module);

const FileHelper = require('areto/helper/FileHelper');
const Response = require('areto/web/Response');