'use strict';

const Base = require('areto/base/Base');

module.exports = class MetaParam extends Base {

    constructor (config) {
        super({
            'meta': config.controller.module.get('meta'),
            'master': {},
            'classParamName': 'c',
            'masterParamName': 'm',
            ...config
        });
    }

    setData (viewName) {
        this.class = this.controller.getQueryParam(this.classParamName);
        this.class = this.meta.getClass(this.class);
        if (!this.class) {
            throw new BadRequest(`Not found meta class`);
        }
        this.project = this.class.project;
        this.view = this.class.getViewByModule(viewName, this.controller.module.NAME);
        this.setMasterData();
    }
};

const BadRequest = require('areto/error/BadRequestHttpException');