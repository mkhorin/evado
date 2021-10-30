/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const Base = require('areto/base/Base');

module.exports = class DataGrid extends Base {

    static getConstants () {
        return {
            DEFAULT_LIMIT: 10,
            MAX_LIMIT: 50,
            ROW_KEY: '_id'
        };
    }

    /**
     * @param {Object} config
     * @param {Object} config.controller - Controller instance
     * @param {Object} config.query - Query instance
     * @param {Object[]} config.formatRules - Server data formatting: [[attrName, type, {params}], ...]
     */
    constructor (config) {
        super({
            request: config.controller.getPostParams(),
            CommonSearch,
            ListFilter,
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
        this._result.maxSize = await this.query.count();
        this.columns = this.request.columns;
        this.setOffset();
        this.setLimit();
        this.setOrder();
        await this.resolveCommonSearch();
        await this.resolveFilter();
        this._result.totalSize = await this.query.count();
        await this.setModels();
        ModelHelper.formatByRules(this.params.formatRules, this._models, this.controller);
        await this.prepareViewModels();
        this._result.items = this.render();
        return this._result;
    }

    setOffset () {
        this.offset = parseInt(this.request.start) || 0;
        this.query.offset(this.offset);
    }

    setLimit () {
        this.limit = parseInt(this.request.length) || this.DEFAULT_LIMIT;
        // in mongodb limit 0 (null) or -N means no limit
        if (isNaN(this.limit) || this.limit < 1) {
            throw new BadRequest('Invalid length param');
        }
        if (this.limit > this.getMaxLimit()) {
            throw new BadRequest('Length exceeds limit');
        }
        this.query.limit(this.limit);
    }

    getMaxLimit () {
        return this.MAX_LIMIT;
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

    resolveCommonSearch () {
        const value = this.request.search;
        if (typeof value === 'string' && value.length) {
            const search = this.spawn(this.CommonSearch, {
                columns: this.columns,
                controller: this.controller
            });
            return search.resolve(this.query, value);
        }
    }

    resolveFilter () {
        const items = this.request.filter;
        if (Array.isArray(items)) {
            return this.spawn(this.ListFilter, {items}).resolve(this.query);
        }
    }

    prepareViewModels () {
        const params = this.params;
        return this.controller.createViewModel(params.viewModel, {params})?.prepareModels(this._models);
    }

    render () {
        return this._models.map(this.renderModel, this);
    }

    renderModel (model) {
        const data = {[this.ROW_KEY]: model.getId()};
        for (const column of this.columns) {
            data[column.name] = this.renderModelAttr(column, model);
        }
        return data;
    }

    renderModelAttr ({name, format}, model) {
        if (!format) {
            return model.getViewAttr(name);
        }
        switch (format.name || format) {
            case 'label':
                return model.getAttrValueLabel(name);
            case 'raw':
                return model.get(name);
            case 'relation':
                return this.renderModelRelation(name, model);
        }
        return model.getViewAttr(name);
    }

    renderModelRelation (name, model) {
        const id = model.get(name);
        const text = model.getRelatedTitle(name);
        if (!Array.isArray(id)) {
            return {id, text};
        }
        const result = [];
        for (let i = 0; i < id.length; ++i) {
            result.push({
                id: id[i],
                text: text[i]
            });
        }
        return result;
    }
};
module.exports.init();

const BadRequest = require('areto/error/http/BadRequest');
const CommonSearch = require('./CommonSearch');
const ListFilter = require('./ListFilter');
const ModelHelper = require('../helper/ModelHelper');