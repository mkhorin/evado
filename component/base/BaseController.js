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
        let ref = this.isGet()
            ? this.getHttpHeader('referrer')
            : this.getPostParam('referrer');
        return ref ? ref : '';
    }

    backToRef (url = 'index') {
        this.redirect(this.getPostParam('referrer') || url);
    }

    getLabelSelectItems (attrName, model) {
        let data = model.constructor.getAttrValueLabels(attrName);
        return SelectHelper.getMapItems(this.translateMessageMap(data));
    }

    gelMapSelectItems (map) {
        return SelectHelper.getMapItems(this.translateMessageMap(map));
    }

    // MODEL

    async getModel (params) {
        params = {
            id: this.getQueryParam('id'),
            ...params
        };
        params.ModelClass = params.ModelClass || this.getModelClass();
        let model = this.spawn(params.ModelClass);
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
        if (params.className) {
            try {
                params.ModelClass = this.module.require(params.className);
            } catch (err) {
                throw new NotFound(`Not found model class: ${params.className}`);
            }
        }
        return this.getModel(params);
    }

    // ERRORS

    handleError (...models) {
        if (this.hasAnyModelError(...models)) {
            this.handleModelError(...models);
        }
    }

    handleModelError (...models) {
        let result = {};
        for (let model of models) {
            if (model) {
                result[model.constructor.name] = this.translateMessageMap(model.getFirstErrors());
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
        return (new DataGrid({
            controller: this,
            query,
            params
        })).sendList();
    }

    async sendSelectList (query, params) {
        let result = await (new Select2({
            request: this.getPostParams(),
            query,            
            params
        })).getList();
        this.sendJson(result);
    }

    async executeHandlers (query, handlers, models) {
        if (!handlers || typeof handlers !== 'object') {
            return false;
        }
        for (let key of Object.keys(handlers)) {
            let options = handlers[key];
            let handler = options && query.model.getHandler(options.name);
            if (handler && Array.isArray(models)) {
                for (let model of models) {
                    await handler.call(model, key, options, this);
                }
            }
        }
    }

    parseMetaParams (data) {
        let result = {meta: this.module.getMeta()};
        data = typeof data === 'string' ? data : '';
        let [id, attrName, viewName, className] = data.split('.');
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
const Select2 = require('../misc/Select2');