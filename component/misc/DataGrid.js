/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const Base = require('areto/base/Base');

module.exports = class DataGrid extends Base {

    static getConstants () {
        return {
            MAX_ITEMS: 50,
            ROW_KEY: '_id'
        };
    }

    constructor (config) {
        super({
            // controller:
            // query: [Query]
            // filter: {}
            // formatRules: [[attrName, type, {params}], ...]
            request: config.controller.getPostParams(),
            ...config
        });
        this.params = this.params || {};
    }

    async sendList () {
        await this.getList();
        if (!this.params.template) {
            return this.controller.sendJson(this._result);
        }
        return this.controller.render(this.params.template, {
            result: this._result,
            models: this._models,
            ...this.params.templateData
        });
    }

    async getList () {
        this._result = {};
        this._viewModel = this.controller.createViewModel(this.params.viewModel, {params: this.params});
        this._result.maxSize = await this.query.count();
        this.setOffset();
        this.setLimit();
        this.setOrder();
        this.setCommonSearch(this.request.search, this.request.columns);
        await this.resolveFilter();
        this._result.totalSize = await this.query.count();
        await this.setModels();
        ModelHelper.formatByRules(this.params.formatRules, this._models, this.controller);
        if (this._viewModel) {
            await this._viewModel.prepareModels(this._models);
        }
        this._result.items = this.filterByColumns(this._models);
        return this._result;
    }

    async setModels () {
        let links = this.request.changes && this.request.changes.links;
        if (Array.isArray(links) && links.length) {
            const key = this.query.model.PK;
            this._models = await this.query.and(['NOT ID', key, links]).all();
            links = await this.query.model.find(['ID', key, links]).with(this.query).offset(0).all();
            this._models = links.concat(this._models);
        } else {
            this._models = await this.query.all();
        }
    }

    setOffset () {
        this.offset = parseInt(this.request.start) || 0;
        this.query.offset(this.offset);
    }

    setLimit () {
        // in mongodb limit 0 (null) or -N means no limit
        this.limit = parseInt(this.request.length);
        if (isNaN(this.limit) || this.limit < 0 || this.limit > this.MAX_ITEMS) {
            throw new BadRequest(`Invalid length param`);
        }
        this.query.limit(this.limit);
    }

    setOrder () {
        const order = this.request.order;
        if (!order) {
            return false;
        }
        for (const name of Object.keys(order)) {
            if (order[name] !== 1 && order[name] !== -1) {
                throw new BadRequest(`Invalid order param`);
            }
        }
        if (Object.values(order).length) {
            this.query.order(order);
        }
    }

    setCommonSearch (value, columns) {
        if (typeof value !== 'string' || !value.length || !Array.isArray(columns)) {
            return false;
        }
        const conditions = [];
        for (const column of this.request.columns) {
            if (column.searchable === true) {
                const condition = this.getConditionByType(column.type, column.name, value);
                if (condition) {
                    conditions.push(condition);
                }
            }
        }
        if (conditions.length) {
            this.query.and(['OR', ...conditions]);
        }
    }

    filterByColumns (models) {
        return Array.isArray(this.request.columns) ? models.map(this.renderModel, this) : [];
    }

    renderModel (model) {
        const data = {[this.ROW_KEY]: model.getId()};
        for (const column of this.request.columns) {
            data[column.name] = model.getViewAttr(column.name);
        }
        return data;
    }

    // FILTER

    async resolveFilter () {
        if (!Array.isArray(this.request.filter)) {
            return false;
        }
        this.query.and(await (new ListFilterCondition({
            items: this.request.filter,
            query: this.query,
            ...this.filter
        })).resolve());
    }

    getConditionByType (type, attr, value) {
        switch (type) {
            case 'number':
            case 'integer':
            case 'float': {
                value = Number(value);
                return isNaN(value) ? null : {[attr]: value};
            }
            case 'date':
            case 'datetime':
            case 'timestamp': {
                value = this.parseDateInterval(value);
                return value ? ['AND', ['>=', attr, value[0]], ['<', attr, value[1]]] : null;
            }
            case 'id': {
                value = this.query.getDb().normalizeId(value);
                return value ? {[attr]: value} : null;
            }
        }
        return ['LIKE', attr, new RegExp(value, 'i')];
    }

    parseDateInterval (value) {
        // value.split('-');
    }
};
module.exports.init();

const BadRequest = require('areto/error/BadRequestHttpException');
const ListFilterCondition = require('./ListFilterCondition');
const ModelHelper = require('../helper/ModelHelper');