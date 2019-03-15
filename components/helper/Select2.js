'use strict';

const Base = require('areto/base/Base');

module.exports = class Select2 extends Base {

    static getConstants () {
        return {
            MAX_ITEMS: 50
        };
    }

    constructor (config) {
        super({
            // query: new Query
            // request: select2 request
            'params': config.params || {},
            ...config
        });
    }

    async getList () {
        let pageSize = parseInt(this.request.pageSize);
        if (isNaN(pageSize) || pageSize < 1 || pageSize > this.MAX_ITEMS) {
            throw new BadRequest(this.wrapClassMessage('Invalid page size'));
        }
        let page = parseInt(this.request.page) || 1;
        if (isNaN(page) || page < 1) {
            throw new BadRequest(this.wrapClassMessage('Invalid page'));
        }
        let text = this.request.search;
        if (typeof text === 'string' && text.length) {
            this.setSearch(text);
        }
        let total = await this.query.count();
        let models = await this.query.offset((page - 1) * pageSize).limit(pageSize).all();
        let items = this.params.getItems
            ? await this.params.getItems.call(this, models, this.params)
            : this.getItems(models);
        return {total, items};
    }

    setSearch (text) {
        let conditions = [];
        this.resolveKeyCondition(text, conditions);
        if (Array.isArray(this.params.searchAttrs)) {
            let stringSearch = this.getStringSearch(text);
            for (let attr of this.params.searchAttrs) {
                if (typeof attr === 'string') {
                    conditions.push({[attr]: stringSearch});
                } else {
                    // TODO parse attr type
                }
            }
        }
        conditions.length
            ? this.query.andJoinByOr(conditions)
            : this.query.where(['FALSE']);
    }

    resolveKeyCondition (text, conditions) {
        if (this.query.model) {
            let id = this.query.model.getDb().normalizeId(text);
            if (id) {
                conditions.push({[this.query.model.PK]: id});
            }
        }
    }

    getStringSearch (text) {
        return new RegExp('^'+ CommonHelper.escapeRegExp(text), 'i');
    }

    getItems (models) {
        let items = [];
        for (let model of models) {
            items.push({
                'id': model.getId(),
                'text': model.getTitle()
            });
        }
        return items;
    }
};
module.exports.init();

const CommonHelper = require('areto/helper/CommonHelper');
const BadRequest = require('areto/error/BadRequestHttpException');