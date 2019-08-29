/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const Base = require('../misc/DataGrid');

module.exports = class MetaDataGrid extends Base {

    constructor (config) {
        super({
            // query: new Query
            // controller: this,
            metaData: config.controller.metaData,
            view: config.controller.getView(),
            ...config
        });
    }

    async getList () {
        this._result = {};
        await this.metaData.security.access.filterObjects(this.query);
        this._result.maxSize = await this.query.count();
        this.setOffset();
        this.setLimit();
        this.setOrder();
        this.setCommonSearch();
        await this.resolveFilter();
        this._result.totalSize = await this.query.count();
        await this.setModels();
        await this.metaData.security.resolveListForbiddenAttrs(this._models, this.metaData.view);
        this._extraData = this.controller.extraMeta.getData(this.metaData.view);
        this._columnMap = this._extraData.columnMap;
        this._result.items = await this.filterByColumns(this._models);
        return this._result;
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

    setOrder () {
        const order = this.request.order;
        if (!order) {
            return false;
        }
        for (const name of Object.keys(order)) {
            const attr = this.metaData.view.getAttr(name);
            if (attr ? !attr.isSortable() : (name !== this.metaData.class.getKey())) {
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

    setCommonSearch () {
        const value = this.request.search;
        if (typeof value !== 'string' || !value.length) {
            return false;
        }
        const conditions = [];
        for (const attr of this.metaData.view.commonSearchAttrs) {
            const condition = attr.getSearchCondition(value);
            if (condition) {
                conditions.push(condition);
            }
        }
        if (!this.metaData.view.commonSearchAttrs.includes(this.metaData.class.getKey())) {
            const condition = this.metaData.class.key.getCondition(value);
            if (condition) {
                conditions.push(condition);
            }
        }
        conditions.length
            ? this.query.and(['OR', ...conditions])
            : this.query.where(['FALSE']);
    }

    async resolveFilter () {
        if (!Array.isArray(this.request.filter)) {
            return null;
        }
        this.query.and(await (new ListFilterCondition({
            view: this.metaData.view,
            items: this.request.filter,
            query: this.query,
            ...this.filter
        })).resolve());
    }

    filterByColumns (models) {
        if (!models.length) {
            return [];
        }
        this._attrTemplateMap = this.getAttrTemplateMap(models[0].view);
        this._readForbiddenAttrs = this.metaData.security.getForbiddenAttrs(Rbac.READ);
        return PromiseHelper.map(models, this.renderModel, this);
    }

    getAttrTemplateMap (view) {
        const map = {};
        for (const attr of view.attrs) {
            map[attr.name] = this.view.getMetaItemTemplate(attr);
        }
        return map;
    }

    async renderModel (model) {
        const result = {
            //[model.class.CLASS_ATTR]: model.get(model.class.CLASS_ATTR)
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
        if (this.isReadForbiddenAttr(name, model)) {
            result[name] = this.metaData.security.noAccessMessage;
        } else if (this._attrTemplateMap[name]) {
            const content = await this.view.render(this._attrTemplateMap[name], {attr, model});
            result[name] = `<!--handler: ${name}-->${content}`;
        } else {
            result[name] = name === this.ROW_KEY ? model.getId() : this.renderAttr(attr, model);
        }
    }

    isReadForbiddenAttr (name, model) {
        return this._readForbiddenAttrs && this._readForbiddenAttrs.includes(name)
            || model.readForbiddenAttrs && model.readForbiddenAttrs.includes(name);
    }

    renderAttr (attr, model) {
        const value = model.semantic.get(attr.name);
        if (attr.rel) {
            return this.renderRelationAttr(value, attr, model);
        }
        if (value instanceof Date) {
            return this.renderDateAttr(value, attr);
        }
        if (value) {
            if (attr.isRelated()) {
                return model.related.getTitle(attr);
            }
            if (attr.isFile()) {
                return this.renderFileAttr(value, attr, model);
            }
        }
        return this.controller.format(value, attr.getFormat());
    }

    renderRelationAttr (data, attr, model) {
        const related = model.related.get(attr);
        if (!related || this._columnMap[attr.name].format.name !== 'link') {
            return data;
        }
        if (!Array.isArray(data)) {
            return {
                id: related.getId(),
                text: data
            };
        }
        const result = [];
        for (let i = 0; i < data.length; ++i) {
            result.push({
                id: related[i].getId(),
                text: data[i]
            });
        }
        return result;
    }

    renderDateAttr (value, attr) {
        return this.controller.format(value, 'clientDate', {
            utc: attr.isUTC(),
            format: attr.getFormat()
        });
    }

    renderFileAttr (value, attr, model) {
        const data = this.getFileAttrData(attr, model);
        const text = data.Behavior.getName(model);
        if (data.preview && data.Behavior.isImage(model)) {
            return this.controller.format(data.preview + model.getId(), 'preview', {
                download: data.download + model.getId(),
                text
            });
        }
        return this.controller.format(data.download + model.getId(), 'download', {text});
    }

    getFileAttrData (attr, model) {
        if (!this._fileAttrData) {
            const Behavior = model.class.FileBehaviorConfig.Class;
            this._fileAttrData = Behavior.getViewData(attr, model.view, this.controller.module.NAME);
            this._fileAttrData.Behavior = Behavior;
        }
        return this._fileAttrData;
    }
};

const BadRequest = require('areto/error/BadRequestHttpException');
const PromiseHelper = require('areto/helper/PromiseHelper');
const ListFilterCondition = require('./MetaListFilterCondition');
const Rbac = require('../security/rbac/Rbac');