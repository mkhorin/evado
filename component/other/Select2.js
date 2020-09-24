/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const Base = require('areto/base/Base');

module.exports = class Select2 extends Base {

    static getConstants () {
        return {
            MAX_PAGE_SIZE: 20
        };
    }

    constructor (config) {
        super({
            // controller
            // query: [new Query]
            request: config.controller.getPostParams(),
            ...config
        });
        this.params = this.params || {};
        this.titleMethod = this.params.titleMethod || 'getTitle';
    }

    async getList () {
        await this.setListParams();
        return this.getListResult();
    }

    async getListResult () {
        const total = await this.query.count();
        const offset = (this._page - 1) * this._pageSize;
        const models = await this.query.offset(offset).limit(this._pageSize).all();
        const items = this.params.getItems
            ? await this.params.getItems.call(this, models, this.params)
            : this.getItems(models);
        return {total, items};
    }

    setListParams () {
        this._pageSize = this.getPageSize();
        this._page = parseInt(this.request.page) || 1;
        if (isNaN(this._page) || this._page < 1) {
            throw new BadRequest(this.wrapClassMessage('Invalid page'));
        }
        const text = this.request.search;
        if (typeof text === 'string' && text.length) {
            return this.setSearch(text);
        }
    }

    getPageSize () {
        const pageSize = parseInt(this.request.pageSize);
        if (isNaN(pageSize) || pageSize < 1) {
            throw new BadRequest(this.wrapClassMessage('Invalid page size'));
        }
        if (pageSize > this.getMaxPageSize()) {
            throw new BadRequest('Page size exceeds limit');
        }
        return pageSize;
    }

    getMaxPageSize () {
        return this.MAX_PAGE_SIZE;
    }

    setSearch (text) {
        const conditions = [];
        this.resolveKeyCondition(text, conditions);
        if (Array.isArray(this.params.searchAttrs)) {
            const stringSearch = this.getStringSearch(text);
            for (const attr of this.params.searchAttrs) {
                if (typeof attr === 'string') {
                    conditions.push({[attr]: stringSearch});
                }
            }
        }
        conditions.length
            ? this.query.and(['OR', ...conditions])
            : this.query.where(['FALSE']);
    }

    resolveKeyCondition (text, conditions) {
        const id = this.query.getDb().normalizeId(text);
        if (id) {
            conditions.push({[this.query.model.PK]: id});
        }
    }

    getStringSearch (text) {
        return new RegExp(EscapeHelper.escapeRegex(text), 'i');
    }

    getItems (models) {
        const result = {};
        for (const model of models) {
            result[model.getId()] = model[this.titleMethod]();
        }
        return result;
    }
};
module.exports.init();

const EscapeHelper = require('areto/helper/EscapeHelper');
const BadRequest = require('areto/error/http/BadRequest');