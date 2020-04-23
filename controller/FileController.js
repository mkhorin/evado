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
                        permissions: ['upload']
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
        if (!await model.upload(this.req, this.res)) {
            return this.sendText(this.translate(model.getFirstError()), 400);
        }
        this.sendJson({
            id: model.getId(),
            mime: model.getMime(),
            size: model.getSize()
        });
    }

    async actionDelete () {
        const model = await this.spawn('model/RawFile').findById(this.getPostParam('id')).one();
        if (!model) {
            return this.sendStatus(404);
        }
        if (model.getOwner()) {
            return this.sendStatus(400);
        }
        await model.delete();
        this.sendStatus(200);
    }

    async actionDownload () {
        const model = await this.getModel();
        const file = model.getPath();
        const stat = await FileHelper.getStat(file);
        if (!stat) {
            model.log('error', 'File not found');
            return this.sendStatus(404);
        }
        this.setHttpHeader(model.getFileHeaders());
        this.sendFile(file);
    }

    async actionThumbnail () {
        const model = await this.getModel();
        const file = await model.ensureThumbnail(this.getQueryParam('s'));
        if (!file) {
            return this.sendStatus(404);
        }
        this.setHttpHeader(model.getThumbnailHeaders());
        this.sendFile(file);
    }
};
module.exports.init(module);

const FileHelper = require('areto/helper/FileHelper');