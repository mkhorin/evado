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
        return this.language
            || this.user?.getLanguage()
            || this.i18n?.language;
    }

    getReferrer () {
        const url = this.isGetRequest()
            ? this.getHttpHeader('referrer')
            : this.getPostParam('referrer');
        return url || '';
    }

    redirectToReferrer (url = 'index') {
        const {referrer} = this.getPostParams();
        this.redirect(referrer || url);
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
            if (token && this.getPostParams().csrf !== token) {
                throw new BadRequest('Invalid CSRF token');
            }
        }
    }

    // MODEL

    async getModel (params = {}) {
        let model = this.spawn(params.Class || this.getModelClass());
        let id = params.id || this.getQueryParam('id') || this.getPostParam('id');
        id = model.getDb().normalizeId(id);
        if (!id) {
            throw new BadRequest('Invalid ID');
        }
        const query = model.findById(id).with(params.with);
        model = await query.one();
        if (!model) {
            throw new NotFound('Object not found');
        }
        return model;
    }

    getModelByClassName (params) {
        const file = params.className;
        if (!file) {
            return this.getModel(params);
        }
        try {
            params.Class = this.module.require(file) || require(file);
            return this.getModel(params);
        } catch {
            throw new NotFound(`Model class not found: ${file}`);
        }
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
                const errors = model.getFirstErrorMap();
                result[model.constructor.name] = this.translateMessageMap(errors);
            }
        }
        this.send(result, Response.BAD_REQUEST);
    }

    hasAnyModelError (...models) {
        for (const model of models) {
            if (model?.hasError()) {
                return true;
            }
        }
    }

    // LIST

    sendGridList (query, params) {
        const grid = this.spawn({
            Class: DataGrid,
            controller: this,
            query,
            params
        });
        return grid.sendList();
    }

    sendTreeGridList (query, params) {
        const grid = this.spawn({
            Class: TreeGrid,
            controller: this,
            query,
            params
        });
        return grid.sendList();
    }

    async sendSelectList (query, params) {
        params = {
            searchAttrs: ['name', 'label'],
            ...params
        };
        const select2 = new Select2({
            controller: this,
            query,
            params
        });
        const result = await select2.getList();
        this.sendJson(result);
    }
};
module.exports.init();

const BadRequest = require('areto/error/http/BadRequest');
const NotFound = require('areto/error/http/NotFound');
const Response = require('areto/web/Response');
const DataGrid = require('../misc/DataGrid');
const TreeGrid = require('../misc/TreeGrid');
const Select2 = require('../misc/Select2');