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
            'id': this.getQueryParam('id'),
            'ModelClass': this.getModelClass(),
            ...params
        };
        params.id = params.ModelClass.getDb().normalizeId(params.id);
        if (!params.id) {
            throw new BadRequest('Invalid ID');
        }
        let query = params.ModelClass.findById(params.id).with(params.with);
        let model = await query.one();
        if (!model) {
            throw new NotFound('Not found model');
        }
        return model;
    }

    getModelByClassName (params) {
        if (params.className) {
            try {
                params.ModelClass = require(this.module.getPath(`model/${params.className}`));
            } catch (err) {
                throw new NotFound(`Not found model class: ${params.className}`);
            }
        }
        return this.getModel(params);
    }

    // ERRORS

    handleError (...models) {
        if (this.hasAnyModelError.apply(this, models)) {
            this.handleModelError.apply(this, models);
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
        return models.filter(model => model && model.hasError()).length > 0;
    }

    // LIST

    sendDataGridList (query, params) {
        return (new DataGrid({
            'controller': this,
            'query': query,
            'params': params
        })).sendList();
    }

    async sendSelectList (query, params) {
        let result = await (new Select2({
            'query': query,
            'request': this.getPostParams(),
            'params': params
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
            if (handler && models instanceof Array) {
                for (let model of models) {
                    await handler.call(model, key, options, this);
                }
            }
        }
    }

    parseMetaParams (data) {
        let result = {
            'meta': this.module.get('meta')
        };
        data = typeof data === 'string' ? data : '';
        let [id, attrName, viewName, className, projectName] = data.split('.');
        result.project = result.meta.getProject(projectName);
        if (result.project) {
            result.class = result.project.getClass(className);
        }
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
const SelectHelper = require('./helper/SelectHelper');
const DataGrid = require('../component/helper/DataGrid');
const Select2 = require('../component/helper/Select2');