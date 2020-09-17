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
        if (data.items) {
            return this.parseNestedItems(data);
        }
        if (this.class.key.name === data.attr) {
            data.type = this.class.key.type;
            return super.parse(data);
        }
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
        if (attr.isClass()) {
            data.type = 'class';
        }
        return super.parse(data);
    }

    parseByType (data) {
        switch (data.type) {
            case 'class':
                return this.parseClass(data);
        }
        return super.parseByType(data);
    }

    parseClass ({attr, op, value}) {
        if (!value) {
            return this.getEmptyValueCondition(attr, op);
        }
        const metaClass = this.class.meta.getClass(value);
        if (!metaClass) {
            return this.throwInvalidValue(value);
        }
        value = metaClass.isAbstract() ? [] : [metaClass.name];
        value.push(...metaClass.getRealDescendants().map(({name}) => name));
        return this.formatSelectorCondition(attr, op, value);
    }

    async parseRelation ({attr, op}) {
        let relation = this.getRelation(attr);
        let value = this.formatByValueType(...arguments) || null;
        if (relation.isRef()) {
            let condition = this.formatSelectorCondition(attr, op, value);
            if (!relation.multiple || value !== null) {
                return condition;
            }
            return op === 'equal'
                ? ['OR', condition, {[attr]: []}]
                : ['AND', condition, ['NOT EQUAL', attr, []]];
        }
        if (!value) {
            return ['FALSE'];
        }
        const query = relation.refClass.find({[relation.refClass.getKey()]: value});
        value = await this.getRelationValue(relation, query);
        attr = relation.linkAttrName;
        return this.formatSelectorCondition(attr, op, value);
    }

    async parseNested ({attr, value}) {
        const relation = this.getRelation(attr);
        const query = relation.refClass.createQuery();
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