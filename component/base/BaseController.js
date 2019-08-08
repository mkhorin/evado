/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const Base = require('areto/base/Controller');

module.exports = class BaseController extends Base {

    static getConstants () {
        return {
            METHODS: {
                'remove': ['post']
            }
        };
    }

    getRefUrl () {
        const ref = this.isGet()
            ? this.getHttpHeader('referrer')
            : this.getPostParam('referrer');
        return ref ? ref : '';
    }

    backToRef (url = 'index') {
        this.redirect(this.getPostParam('referrer') || url);
    }

    getLabelSelectItems (attrName, model) {
        const data = model.constructor.getAttrValueLabels(attrName);
        return SelectHelper.getMapItems(this.translateMessageMap(data));
    }

    getMapSelectItems (map) {
        return SelectHelper.getMapItems(this.translateMessageMap(map));
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
            throw new NotFound('Not found model');
        }
        return model;
    }

    getModelByClassName (params) {
        const file = params.className;
        if (file) {
            try {
                params.Class = this.module.require(file) || require(file);
            } catch (err) {
                throw new NotFound(`Not found model class: ${file}`);
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
        for (let model of models) {
            if (model) {
                result[model.constructor.name] = this.translateMessageMap(model.getFirstErrorMap());
            }
        }
        this.send(result, 400);
    }

    hasAnyModelError (...models) {
        for (let model of models) {
            if (model && model.hasError()) {
                return true;
            }
        }
    }

    // LIST

    sendDataGridList (query, params) {
        return (new DataGrid({controller: this, query, params})).sendList();
    }

    sendTreeDataGridList (query, params) {
        return (new TreeDataGrid({controller: this, query, params})).sendList();
    }

    async sendSelectList (query, params) {
        params = {
            searchAttrs: ['name', 'label'],
            ...params
        };
        const request = this.getPostParams();
        const result = await (new Select2({request, query, params})).getList();
        this.sendJson(result);
    }

    // META

    parseMetaParams (data) {
        const result = {meta: this.module.getMeta()};
        data = typeof data === 'string' ? data : '';
        const [id, attrName, viewName, className] = data.split('.');
        result.class = result.meta.getClass(className);
        if (result.class) {
            result.view = result.class.getView(viewName) || result.class;
        }
        if (result.view) {
            result.attr = result.view.getAttr(attrName);
        }
        return result;
    }
};
module.exports.init();

const BadRequest = require('areto/error/BadRequestHttpException');
const NotFound = require('areto/error/NotFoundHttpException');
const SelectHelper = require('../helper/SelectHelper');
const DataGrid = require('../misc/DataGrid');
const TreeDataGrid = require('../misc/TreeDataGrid');
const Select2 = require('../misc/Select2');