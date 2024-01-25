/**
 * @copyright Copyright (c) 2020 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const Base = require('../misc/Select2');

module.exports = class MetaSelect2 extends Base {

    constructor (config) {
        super({
            searchAttrs: config.query.view.selectSearchAttrs,
            ...config
        });
    }

    async getList () {
        await this.setListParams();
        this.query.security = this.controller.security;
        await this.query.security.access.assignObjectFilter(this.query);
        return this.getListResult();
    }

    getMaxPageSize () {
        return this.query.view.options.listLimit || this.MAX_PAGE_SIZE;
    }

    async setSearch (value) {
        const conditions = [];
        this.resolveKeyCondition(value, conditions);
        if (Array.isArray(this.searchAttrs)) {
            const regex = this.getStringSearch(value);
            const number = parseFloat(value);
            for (const attr of this.searchAttrs) {
                if (attr.isString()) {
                    conditions.push({[attr.name]: regex});
                } else if (attr.isNumber() && !isNaN(number)) {
                    conditions.push({[attr.name]: number});
                } else if (attr.isEmbeddedModel()) {
                    await this.resolveEmbeddedCondition(attr, value, regex, conditions);
                }
            }
        }
        conditions.length
            ? this.query.and(['or', ...conditions])
            : this.query.where(['false']);
    }

    resolveKeyCondition (value, conditions) {
        const {key} = this.query.view.class;
        value = key.normalize(value);
        if (value) {
            conditions.push({[key.name]: value});
        }
    }

    async resolveEmbeddedCondition (attr, value, regex, conditions) {
        const id = attr.embeddedModel.getDb().normalizeId(value);
        if (id) {
            return conditions.push({[attr.name]: id});
        }
        if (attr.isEagerLoading()) {
            const query = attr.embeddedModel.findByTitle(value);
            if (query) {
                const ids = await query.ids();
                return conditions.push({[attr.name]: ids});
            }
        }
    }
};

module.exports.init();