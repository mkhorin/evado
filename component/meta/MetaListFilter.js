/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const Base = require('../other/ListFilter');

module.exports = class MetaListFilter extends Base {

    resolve (query) {
        this.class = query.view.class;
        return super.resolve(query);
    }

    parse (data) {
        const attr = this.class.getAttr(data.attr);
        if (!this.class.searchAttrs.includes(attr)) {
            return this.throwBadRequest(`Invalid search attribute: ${data.attr}.${this.class.id}`);
        }
        if (!data.type) {
            data.type = attr.type;
        }
        if (attr.relation) {
            data.relation = true;
            data.valueType = attr.relation.getRefAttrType();
        }
        return super.parse(data);
    }

    async parseRelation ({attr, op}) {
        let relation = this.getRelation(attr);
        let value = this.formatByValueType(...arguments) || null;
        if (relation.isRef()) {
            return this.formatSelectorCondition(attr, op, value);
        }
        if (!value) {
            return ['FALSE'];
        }
        const query = relation.refClass.find().and({[relation.refClass.getKey()]: value});
        value = await this.getRelationValue(relation, query);
        attr = relation.linkAttrName;
        return this.formatSelectorCondition(attr, op, value);
    }

    async parseNested ({attr, value}) {
        const relation = this.getRelation(attr);
        const query = relation.refClass.find();
        await (new this.constructor({items: value})).resolve(query);
        if (relation.isBackRef()) {
            attr = relation.linkAttrName;
            value = await this.getRelationValue(relation, query);
        } else {
            value = await query.column(relation.refClass.getKey());
        }
        return {[attr]: value};
    }

    getRelation (name) {
        const attr = this.class.getAttr(name);
        return attr.relation || this.throwBadRequest(`Invalid relation: ${attr.id}`);
    }

    async getRelationValue (relation, query) {
        const values = await query.column(relation.refAttrName);
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