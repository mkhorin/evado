/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const Base = require('../misc/ListFilter');

module.exports = class MetaListFilter extends Base {

    parse (data) {
        if (data.items) {
            return this.parseNestedCondition(data);
        }
        if (this.class.key.name === data.attr) {
            data.type = this.class.key.type;
            return super.parse(data);
        }
        if (data.type === 'descendant') {
            return this.parseDescendant(data);
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
        }
        if (attr.isClassView()) {
            data.type = 'class';
        }
        return super.parse(data);
    }

    parseDescendant (data) {
        const descendant = this.class.meta.getClass(data.class);
        if (!descendant) {
            return this.throwBadRequest(`Class not found: ${data.class}`);
        }
        const filter = new this.constructor({
            class: descendant,
            query: this.query
        });
        return filter.resolveItems(data.value);
    }

    parseByType (data) {
        switch (data.type) {
            case 'class': {
                return this.parseClass(data);
            }
        }
        return super.parseByType(data);
    }

    parseClass ({attr, op, value}) {
        if (!value) {
            return this.getEmptyValueCondition(attr, op);
        }
        const cls = this.class.meta.getClass(value);
        if (!cls) {
            return this.throwInvalidValue(value);
        }
        value = cls.isAbstract() ? [] : [cls.name];
        value.push(...cls.getRealDescendants().map(({name}) => name));
        return this.formatSelectorCondition(attr, op, value);
    }

    async parseRelation ({attr, op, value}) {
        value = this.formatByValueType(value, 'id') || null;
        const relation = this.getRelation(attr);
        if (relation.isRef()) {
            return this.getRefCondition(relation, attr, op, value);
        }
        return value
            ? this.getBackRefCondition(relation, attr, op, value)
            : this.getEmptyBackRefCondition(relation, attr, op);
    }

    getRefCondition (relation, attr, op, value) {
        let condition = this.formatSelectorCondition(attr, op, value);
        if (!relation.multiple || value !== null) {
            return condition;
        }
        return op === 'equal'
            ? ['or', condition, {[attr]: []}]
            : ['and', condition, ['notEqual', attr, []]];
    }

    async getBackRefCondition (relation, attr, op, value) {
        const key = relation.refClass.getKey();
        const query = relation.refClass.find({[key]: value});
        value = await this.getRelationValue(relation, query);
        return this.formatSelectorCondition(relation.linkAttrName, op, value);
    }

    async getEmptyBackRefCondition ({refClass, refAttrName, linkAttrName}, attr, op) {
        const linked = await refClass.find().distinct(refAttrName);
        if (!linked.length) {
            return null;
        }
        if (op === 'equal') {
            return ['notIn', linkAttrName, linked];
        }
        if (op === 'notEqual') {
            return {[linkAttrName]: linked};
        }
        this.throwInvalidOperation(op);
    }

    async parseNestedOperation ({attr, value}) {
        const relation = this.getRelation(attr);
        const query = relation.refClass.createQuery();
        const filter = new this.constructor({
            class: relation.refClass,
            items: value,
            query
        });
        await filter.resolve();
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
        return attr.relation
            || this.throwBadRequest(`Invalid relation: ${attr.id}`);
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