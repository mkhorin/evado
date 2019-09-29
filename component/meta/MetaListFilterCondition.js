/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const Base = require('../misc/ListFilterCondition');

module.exports = class MetaListFilterCondition extends Base {

    parse ({attr}) {
        return this.view.searchAttrs.includes(this.view.getAttr(attr))
            ? super.parse(...arguments)
            : this.throwBadRequest(`Invalid search attribute: ${attr}.${this.view.id}`);
    }

    parseRelation ({attr, op}) {
        let rel = this.getRelation(attr);
        let value = this.formatByValueType(...arguments);
        if (!value) {
            return null;
        }
        if (rel.isBackRef()) {
            const query = rel.refClass.find().and({[rel.refClass.getKey()]: value});
            value = this.getRelationValue(rel, query);
            attr = rel.linkAttrName;
        }
        return this.formatSelectorCondition(attr, op, value);
    }

    async parseNested ({attr, value}) {
        const rel = this.getRelation(attr);
        const query = rel.refClass.find();
        const filter = this.grid.createFilter({
            view: rel.attr.getRefClass(),
            items: value,
            query
        });
        const condition = await filter.resolve();
        query.and(condition);
        if (rel.isBackRef()) {
            attr = rel.linkAttrName;
            value = await this.getRelationValue(rel, query);
        } else {
            value = await query.column(rel.refClass.getKey());
        }
        return {[attr]: value};
    }

    getRelation (name) {
        const attr = this.view.getAttr(name);
        return attr.rel || this.throwBadRequest(`Invalid relation: ${attr.id}`);
    }

    async getRelationValue (rel, query) {
        const values = await query.column(rel.refAttrName);
        const result = [];
        for (const value of values) {
            if (value !== null) {
                result.push(value);
            }
        }
        return ArrayHelper.concat(result);
    }
};

const ArrayHelper = require('areto/helper/ArrayHelper');