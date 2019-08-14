/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const Base = require('areto/base/Base');

module.exports = class MetaParam extends Base {

    constructor (config) {
        super({
            meta: config.controller.module.getMeta(),
            master: {},
            classParamName: 'c',
            masterParamName: 'm',
            ...config
        });
    }

    setData (viewName) {
        this.class = this.controller.getQueryParam(this.classParamName);
        this.class = this.meta.getClass(this.class);
        if (!this.class) {
            throw new BadRequest(`Meta class not found`);
        }
        this.view = this.class.getViewByModule(viewName, this.controller.module.NAME);
        this.setMasterData();
    }

    setMasterData () {
    }
};

const BadRequest = require('areto/error/BadRequestHttpException');