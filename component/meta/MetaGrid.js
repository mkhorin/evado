/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const Base = require('../misc/DataGrid');

module.exports = class MetaGrid extends Base {

    constructor (config) {
        super({
            // query: new Query
            meta: config.controller.meta,
            security: config.controller.security,
            actionView: config.controller.getView(),
            CommonSearch: MetaCommonSearch,
            ListFilter: MetaListFilter,
            ...config
        });
    }

    async getList () {
        this._result = {};
        this.query.security = this.security;
        await this.security.access.assignObjectFilter(this.query);
        this._result.maxSize = await this.query.count();
        this.setOffset();
        this.setLimit();
        this.setOrder();
        await this.resolveCommonSearch();
        await this.resolveFilter();
        this._result.totalSize = await this.query.count();
        await this.setModels();
        await this.prepareViewModels();
        this._result.items = await this.render(this._models);
        return this._result;
    }

    setOrder () {
        const order = this.request.order;
        if (!order) {
            return false;
        }
        for (const name of Object.keys(order)) {
            const attr = this.meta.view.getAttr(name);
            if (attr ? !attr.isSortable() : (name !== this.meta.class.getKey())) {
                throw new BadRequest(`Not sortable attribute: ${name}`);
            }
            if (order[name] !== 1 && order[name] !== -1) {
                throw new BadRequest(`Invalid order: ${name}`);
            }
        }
        if (Object.values(order).length) {
            this.query.order(order);
        }
    }

    async setModels () {
        let links = this.request.changes && this.request.changes.links;
        if (Array.isArray(links) && links.length) {
            this._models = await this.query.and(['NOT ID', this.query.view.getKey(), links]).all();
            links = await this.query.where(['ID', this.query.view.getKey(), links]).offset(0).all();
            this._models = links.concat(this._models);
        } else {
            this._models = await this.query.all();
        }
    }

    prepareViewModels () {
        const model = this.actionView.createViewModel();
        return model ? model.prepareModels(this._models) : null;
    }

    render () {
        if (!this._models.length) {
            return this._models;
        }
        this._forbiddenAttrs = this.security.getReadForbiddenAttrMap();
        this._forbiddenRelationMap = this.security.getReadForbiddenRelationMap(this.meta.view);
        this._columnMap = this.controller.extraMeta.getData(this.meta.view).columnMap;
        this._attrTemplateMap = this.getAttrTemplateMap();
        return PromiseHelper.map(this._models, this.renderModel, this);
    }

    getAttrTemplateMap () {
        const data = {};
        for (const attr of this.meta.view.attrs) {
            data[attr.name] = this.actionView.getMetaItemTemplate(attr);
        }
        return data;
    }

    async renderModel (model) {
        const result = {
            _title: model.getTitle()
        };
        await PromiseHelper.setImmediate();
        for (const attr of model.view.attrs) {
            await this.renderCell(attr, model, result);
        }
        if (!model.view.hasKeyAttr()) {
            result[model.view.getKey()] = model.getId();
        }
        return result;
    }

    async renderCell (attr, model, result) {
        const name = attr.name;
        if (this.isForbiddenAttr(name, model)) {
            result[name] = this.renderNoAccess();
        } else if (this._attrTemplateMap[name]) {
            const content = await this.actionView.render(this._attrTemplateMap[name], {attr, model});
            result[name] = `<!--handler: ${name}-->${content}`;
        } else {
            result[name] = name === this.ROW_KEY ? model.getId() : this.renderAttr(attr, model);
        }
    }

    isForbiddenAttr (name, model) {
        return this._forbiddenRelationMap[name] === true
            || this._forbiddenAttrs && this._forbiddenAttrs.includes(name)
            || model.readForbiddenAttrs && model.readForbiddenAttrs.includes(name);
    }

    renderNoAccess () {
        if (!this._noAccessValue) {
            this._noAccessValue = this.controller.format(null, 'noAccess');
        }
        return this._noAccessValue;
    }

    renderAttr (attr, model) {
        if (model.hasDisplayValue(attr)) {
            return model.getDisplayValue(attr);
        }
        const value = model.header.get(attr.name);
        if (attr.relation) {
            return this.renderRelationAttr(value, attr, model);
        }
        if (value instanceof Date) {
            return value.toISOString();
        }
        if (value) {
            if (attr.isEmbeddedModel()) {
                return model.related.getTitle(attr);
            }
            if (attr.isFile()) {
                return this.renderFileAttr(attr, model);
            }
            if (attr.isState()) {
                const state = model.class.getState(value);
                return state ? state.title : value;
            }
            if (attr.escaping) {
                return ModelHelper.escapeValue(value);
            }
        }
        return this.controller.format(value, attr.getFormat());
    }

    renderRelationAttr (data, attr, model) {
        const related = model.related.get(attr);
        if (!related) {
            return data || '';
        }
        return this._columnMap[attr.name].format.name === 'link'
            ? this.renderRelatedLink(related, data)
            : this.renderRelated(related, data);
    }

    renderRelatedLink (related, title) {
        if (!Array.isArray(related)) {
            return {
                id: related.getId(),
                text: title
            };
        }
        if (!Array.isArray(title)) {
            return title;
        }
        const result = [];
        for (let i = 0; i < related.length; ++i) {
            result.push({
                id: related[i].getId(),
                text: title[i]
            });
        }
        return result;
    }

    renderRelated (related, title) {
        if (!Array.isArray(related)) {
            const result = related.output();
            result._title = title;
            return result;
        }
        if (!Array.isArray(title)) {
            return title;
        }
        const result = [];
        for (let i = 0; i < related.length; ++i) {
            const data = related[i].output();
            result._title = title[i];
            result.push(data);
        }
        return result;
    }

    renderFileAttr (attr, model) {
        const {file, name, preview} = this.controller.extraMeta.getModelFileData(model, attr);
        if (!file) {
            return this.controller.format(null);
        }
        return preview
            ? this.controller.format(preview, 'preview', {text: name})
            : name;
    }
};

const PromiseHelper = require('areto/helper/PromiseHelper');
const BadRequest = require('areto/error/BadRequestHttpException');
const MetaCommonSearch = require('./MetaCommonSearch');
const MetaListFilter = require('./MetaListFilter');
const ModelHelper = require('../helper/ModelHelper');