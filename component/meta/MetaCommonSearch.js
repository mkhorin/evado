/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const Base = require('../misc/CommonSearch');

module.exports = class MetaCommonSearch extends Base {

    async resolve (query, value) {
        const {view} = query;
        const conditions = [];
        for (const attr of view.commonSearchAttrs) {
            const condition = await this.getAttrCondition(attr, value);
            if (condition) {
                conditions.push(condition);
            }
        }
        if (!view.commonSearchAttrs.includes(view.class.getKey())) {
            const condition = view.class.key.getCondition(value);
            if (condition) {
                conditions.push(condition);
            }
        }
        conditions.length
            ? query.and(['or', ...conditions])
            : query.where(['false']);
    }

    getAttrCondition (attr, value) {
        if (attr.isEmbeddedModel() && attr.isEagerLoading()) {
            return this.getEmbeddedCondition(attr, value);
        }
        if (attr.isDate()) {
            value = this.getDateValue(value);
        }
        return attr.getSearchCondition(value);
    }

    async getEmbeddedCondition (attr, value) {
        const id = attr.embeddedModel.getDb().normalizeId(value);
        if (id) {
            return {[attr.name]: id};
        }
        const query = attr.embeddedModel.findByTitle(value);
        if (!query) {
            return null;
        }
        const ids = await query.ids();
        return {[attr.name]: ids};
    }

    getDateValue (value) {
        if (this._dateValue === undefined) {
            this._dateValue = DateHelper.parse(value, this.controller.language);
        }
        return this._dateValue;
    }
};

const DateHelper = require('areto/helper/DateHelper');