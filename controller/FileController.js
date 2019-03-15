'use strict';

const Base = require('../component/BaseController');

module.exports = class FileController extends Base {

    static getConstants () {
        return {
           /* BEHAVIORS: {
                'access': {
                    Class: require('areto/filter/AccessControl'),
                    rules: [{
                        actions: ['upload'],
                        roles: ['@']
                    }]
                }
            },
            */
            METHODS: {
                'upload': 'post'
            }
        };
    }

    async actionUpload () {
        let model = new File({
            'meta': this.parseMetaParams(this.getQueryParam('m')),
            'req': this.req,
            'res': this.res
        });
        model.set('author', this.user.getId());
        if (!await model.save()) {
            return this.sendText(this.translate(model.getFirstError()), 400);
        }
        this.sendJson({
            'id': model.getId(),
            'size': this.format(model.get('size'), 'bytes'),
            'message': this.translate('Uploading complete')
        });
    }

    async actionDownload () {
        let model = await this.getModel();
        model.meta = this.parseMetaParams(this.getQueryParam('m'));
        if (!model.isFileExists()) {
            throw new Error(`File not exists`);
        }
        this.setHttpHeader(model.getFileHeaders());
        this.sendFile(model.getPath());
    }

    async actionPreview () {
        let model = await this.getModel();
        model.meta = this.parseMetaParams(this.getQueryParam('m'));
        let thumbPath = await model.ensureThumb(this.getQueryParam('s'));
        this.setHttpHeader(model.getThumbHeaders());
        this.sendFile(thumbPath);
    }
};
module.exports.init(module);

const File = require('../model/File');