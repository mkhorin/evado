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
                        actions: ['upload', 'remove'],
                        permissions: ['upload']
                    }]
                }
            },
            METHODS: {
                'upload': 'post',
                'remove': 'post'
            }
        };
    }

    async actionUpload () {
        let model = this.spawn('model/RawFile', {user: this.user});
        if (!await model.upload(this.req, this.res)) {
            return this.sendText(this.translate(model.getFirstError()), 400);
        }
        this.sendJson({
            id: model.getId(),
            size: this.format(model.get('size'), 'bytes')
        });
    }

    async actionRemove () {
        let query = this.spawn('model/RawFile').findById(this.getPostParam('id'));
        let model = await query.and({owner: null}).one();
        if (model) {
            await model.remove();
        }
        this.sendStatus(200);
    }

    async actionDownload () {
        let model = await this.getModel();
        this.setHttpHeader(model.getFileHeaders());
        this.sendFile(model.getPath());
    }

    async actionPreview () {
        let model = await this.getModel();
        let file = await model.ensurePreview(this.getQueryParam('s'));
        if (!file) {
            return this.sendStatus(404);
        }
        this.setHttpHeader(model.getPreviewHeaders());
        this.sendFile(file);
    }

};
module.exports.init(module);