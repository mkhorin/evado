/**
 * @copyright Copyright (c) 2020 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const Base = require('areto/base/Controller');

module.exports = class BaseController extends Base {

    static getConstants () {
        return {
            ACTION_VIEW: {
                Class: require('./ActionView')
            }
        };
    }

    getLanguage () {
        return this.language || this.user.getLanguage() || this.i18n?.language;
    }

    getReferrer () {
        const url = this.isGetRequest()
            ? this.getHttpHeader('referrer')
            : this.getPostParam('referrer');
        return url || '';
    }

    redirectToReferrer (url = 'index') {
        this.redirect(this.getPostParam('referrer') || url);
    }

    getSpawnConfig (params) {
        return {
            controller: this,
            module: this.module,
            user: this.user,
            ...params
        };
    }

    checkCsrfToken () {
        if (this.user.auth.csrf && this.isPostRequest()) {
            const token = this.getCsrfToken();
            if (token && this.getPostParam('csrf') !== token) {
                throw new BadRequest('Invalid CSRF token');
            }
        }
    }

    // MODEL

    async getModel (params = {}) {
        if (!params.id) {
            params.id = this.getQueryParam('id') || this.getPostParam('id');
        }
        params.Class = params.Class || this.getModelClass();
        let model = this.spawn(params.Class);
        params.id = model.getDb().normalizeId(params.id);
        if (!params.id) {
            throw new BadRequest('Invalid ID');
        }
        model = await model.findById(params.id).with(params.with).one();
        if (!model) {
            throw new NotFound('Object not found');
        }
        return model;
    }

    getModelByClassName (params) {
        const file = params.className;
        if (file) {
            try {
                params.Class = this.module.require(file) || require(file);
            } catch {
                throw new NotFound(`Model class not found: ${file}`);
            }
        }
        return this.getModel(params);
    }

    // ERROR

    handleError (...models) {
        if (this.hasAnyModelError(...models)) {
            this.handleModelError(...models);
        }
    }

    handleModelError (...models) {
        const result = {};
        for (const model of models) {
            if (model) {
                result[model.constructor.name] = this.translateMessageMap(model.getFirstErrorMap());
            }
        }
        this.send(result, 400);
    }

    hasAnyModelError (...models) {
        for (const model of models) {
            if (model && model.hasError()) {
                return true;
            }
        }
    }

    // LIST

    sendGridList (query, params) {
        return this.spawn({
            Class: DataGrid,
            controller: this,
            query,
            params
        }).sendList();
    }

    sendTreeGridList (query, params) {
        return this.spawn({
            Class: TreeGrid,
            controller: this,
            query,
            params
        }).sendList();
    }

    async sendSelectList (query, params) {
        params = {
            searchAttrs: ['name', 'label'],
            ...params
        };
        const select2 = new Select2({controller: this, query, params});
        const result = await select2.getList();
        this.sendJson(result);
    }
};
module.exports.init();

const BadRequest = require('areto/error/http/BadRequest');
const NotFound = require('areto/error/http/NotFound');
const DataGrid = require('../other/DataGrid');
const TreeGrid = require('../other/TreeGrid');
const Select2 = require('../other/Select2');