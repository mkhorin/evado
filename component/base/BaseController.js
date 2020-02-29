/**
 * @copyright Copyright (c) 2020 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const Base = require('areto/base/Controller');

module.exports = class BaseController extends Base {

    getReferrer () {
        const url = this.isGet()
            ? this.getHttpHeader('referrer')
            : this.getPostParam('referrer');
        return url ? url : '';
    }

    redirectToReferrer (url = 'index') {
        this.redirect(this.getPostParam('referrer') || url);
    }

    getLabelSelectItems (attrName, model) {
        const data = model.constructor.getAttrValueLabels(attrName);
        return SelectHelper.getMapItems(data);
    }

    getMapSelectItems (map) {
        return SelectHelper.getMapItems(map);
    }

    resolveFilterColumns (columns, model) {
        for (const column of columns) {
            if (column.label === undefined) {
                column.label = model.getAttrLabel(column.name);
            }
            if (column.items === 'labels') {
                column.items = this.getLabelSelectItems(column.name, model);
            }
            if (column.columns) {
                this.resolveFilterColumns(column.columns, model.getRelation(column.name).model);
            }
        }
    }

    getSpawnConfig (params) {
        return {
            controller: this,
            module: this.module,
            user: this.user,
            ...params
        };
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
            throw new NotFound('Model not found');
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
        const request = this.getPostParams();
        const result = await (new Select2({request, query, params})).getList();
        this.sendJson(result);
    }
};
module.exports.init();

const BadRequest = require('areto/error/BadRequestHttpException');
const NotFound = require('areto/error/NotFoundHttpException');
const SelectHelper = require('../helper/SelectHelper');
const DataGrid = require('../other/DataGrid');
const TreeGrid = require('../other/TreeGrid');
const Select2 = require('../other/Select2');