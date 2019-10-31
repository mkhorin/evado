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
            gridView: 'grid',
            ListFilterCondition,
            ...config
        });
    }

    async getList () {
        this._result = {};
        this._viewModel = this.controller.createViewModel(this.viewModel);
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
        await this.prepareViewModels();
        this._result.items = await this.filterByColumns(this._models);
        return this._result;
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
        this.query.andSearch(this.request.search);
    }

    async resolveFilter () {
        if (!Array.isArray(this.request.filter)) {
            return null;
        }
        const filter = this.createFilter({
            view: this.metaData.class,
            items: this.request.filter,
            query: this.query
        });
        this.query.and(await filter.resolve());
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
        const model = this.view.createViewModel();
        return model ? model.prepareModels(this._models) : null;
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
        const value = model.headline.get(attr.name);
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
                return this.renderFileAttr(attr, model);
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

    renderFileAttr (attr, model) {
        const data = this.controller.extraMeta.getModelFileData(model, attr);
        if (!data.file) {
            return this.controller.format(null);
        }
        if (!data.preview) {
            return this.controller.format(data.download, 'download', {text: data.name});
        }
        return this.controller.format(data.preview, 'preview', {
            download: data.download,
            text: data.name
        });
    }
};

const BadRequest = require('areto/error/BadRequestHttpException');
const PromiseHelper = require('areto/helper/PromiseHelper');
const ListFilterCondition = require('./MetaListFilterCondition');
const Rbac = require('../security/rbac/Rbac');