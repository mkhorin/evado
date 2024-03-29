/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const Base = require('../misc/DataGrid');

module.exports = class MetaGrid extends Base {

    static getConstants () {
        return {
            RELATED_HANDLERS: { // eager loaded
                link: 'renderRelatedLink',
                thumbnail: 'renderRelatedThumbnail'
            },
            RELATION_HANDLERS: {
                thumbnail: 'renderRelationThumbnail'
            }
        };
    }

    /**
     * @param {Object} config
     * @param {Object} config.query - Query instance
     */
    constructor (config) {
        super({
            meta: config.controller.meta,
            security: config.controller.security,
            actionView: config.controller.getView(),
            CommonSearch: MetaCommonSearch,
            ListFilter: MetaListFilter,
            ...config
        });
    }

    async count () {
        this._result = {};
        this.query.security = this.security;
        await this.security.access.assignObjectFilter(this.query);
        this.setOffset();
        await this.resolveCommonSearch();
        await this.resolveFilter();
        return this.query.count();
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

    setLimit () {
        if (!this.query.getLimit()) {
            super.setLimit();
        }
    }

    getMaxLimit () {
        return this.meta.view.options.listLimit || this.MAX_LIMIT;
    }

    setOrder () {
        const {order} = this.request;
        if (!order) {
            return false;
        }
        for (const name of Object.keys(order)) {
            this.checkOrderData(name, order);
        }
        if (Object.values(order).length) {
            this.query.order(order);
        }
    }

    checkOrderData (name, data) {
        const attr = this.meta.view.getAttr(name);
        if (attr) {
            if (!attr.isSortable()) {
                throw new BadRequest(`Not sortable attribute: ${name}`);
            }
        } else if (name !== this.meta.class.getKey()) {
            if (this.meta.view !== this.meta.class) {
                if (!this.meta.class.getAttr(name)?.isSortable()) {
                    throw new BadRequest(`Not sortable class attribute: ${name}`);
                }
            }
        }
        if (data[name] !== 1 && data[name] !== -1) {
            throw new BadRequest(`Invalid order value: ${name}: ${data[name]}`);
        }
    }

    createFilter () {
        return super.createFilter({
            class: this.query.view.class
        });
    }

    async setModels () {
        let links = this.request.changes?.links;
        if (Array.isArray(links) && links.length) {
            const key = this.query.view.getKey();
            this._models = await this.query.and(['notId', key, links]).all();
            links = await this.query.where(['id', key, links]).offset(0).all();
            this._models = links.concat(this._models);
        } else {
            this._models = await this.query.all();
        }
    }

    prepareViewModels () {
        return this.actionView.createViewModel()?.prepareModels(this._models);
    }

    render () {
        if (!this._models.length) {
            return this._models;
        }
        this._forbiddenAttrs = this.security.getForbiddenReadAttrs();
        const viewData = this.controller.extraMeta.getData(this.meta.view);
        this._columnMap = viewData.columnMap;
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
        const {view} = this.meta;
        for (const attr of view.attrs) {
            await this.renderCell(attr, model, result);
        }
        if (!view.hasKeyAttr()) {
            result[view.getKey()] = model.getId();
        }
        result._class = model.view.class.name;
        return result;
    }

    async renderCell (attr, model, result) {
        const {name} = attr;
        if (this.isForbiddenAttr(name, model)) {
            this.setForbiddenAttr(name, result);
        } else if (this._attrTemplateMap[name]) {
            const content = await this.actionView.render(this._attrTemplateMap[name], {attr, model});
            result[name] = `<!--handler: ${name}-->${content}`;
        } else if (name === this.ROW_KEY) {
            result[name] = model.getId();
        } else {
            result[name] = this.renderAttr(attr, model, result);
        }
    }

    isForbiddenAttr (name, model) {
        return this._forbiddenAttrs?.includes(name)
            || model.forbiddenReadAttrs?.includes(name);
    }

    setForbiddenAttr (name, result) {
        if (result._forbidden) {
            result._forbidden.push(name);
        } else {
            result._forbidden = [name];
        }
    }

    renderAttr (attr, model, result) {
        if (model.hasDisplayValue(attr)) {
            return model.getDisplayValue(attr);
        }
        const value = model.header.get(attr);
        if (attr.relation) {
            const relative = model.related.get(attr);
            return relative
                ? this.renderRelatedAttr(relative, value, attr)
                : this.renderRelationAttr(value, attr)
        }
        if (value instanceof Date) {
            return value.toISOString();
        }
        if (!value) {
            return value;
        }
        if (attr.isFile()) {
            return this.renderFileAttr(attr, model);
        }
        const key = this._columnMap[attr.name].titleName;
        if (attr.enum) {
            result[key] = value;
            return model.get(attr);
        }
        if (attr.isEmbeddedModel()) {
            result[key] = model.related.getTitle(attr);
        } else if (attr.isStateView()) {
            result[key] = model.class.getState(value)?.title;
        } else if (attr.isClassView()) {
            result[key] = model.class.meta.getClass(value)?.title;
        } else if (attr.isClassesView()) {
            result[key] = model.class.meta.getClassTitles(value);
        }
        return value;
    }

    renderFileAttr ({options}, model) {
        return this.controller.extraMeta.getModelFileData(model, options.thumbnail);
    }

    renderRelatedAttr (related, value, attr) {
        const handler = this.getRenderRelatedHandler(attr);
        if (!Array.isArray(related)) {
            return handler.call(this, related, value, attr);
        }
        if (!Array.isArray(value)) {
            return value;
        }
        const result = [];
        for (let i = 0; i < related.length; ++i) {
            result.push(handler.call(this, related[i], value[i], attr));
        }
        return result;
    }

    getRenderRelatedHandler ({name}) {
        return this[this.RELATED_HANDLERS[this._columnMap[name].format.name]]
            || this.renderRelatedDefault;
    }

    renderRelatedDefault (model, title) {
        const result = model.output();
        result._title = title;
        return result;
    }

    renderRelatedLink (model, text) {
        return {id: model.getId(), text};
    }

    renderRelatedThumbnail (model, title, {options}) {
        const data = this.controller.extraMeta.getModelFileData(model, options.thumbnail);
        if (data) {
            data.name = title;
            return data;
        }
    }

    renderRelationAttr (value, attr) {
        const handler = this.getRenderRelationHandler(attr);
        if (!handler) {
            return value;
        }
        if (!Array.isArray(value)) {
            return handler.call(this, value, attr);
        }
        const result = [];
        for (const val of value) {
            result.push(handler.call(this, val, attr));
        }
        return result;
    }

    getRenderRelationHandler ({name}) {
        return this[this.RELATION_HANDLERS[this._columnMap[name].format.name]];
    }

    renderRelationThumbnail (id, attr) {
        return this.controller.extraMeta.getRelationThumbnailData(attr, id);
    }
};
module.exports.init();

const PromiseHelper = require('areto/helper/PromiseHelper');
const BadRequest = require('areto/error/http/BadRequest');
const MetaCommonSearch = require('./MetaCommonSearch');
const MetaListFilter = require('./MetaListFilter');