/**
 * @copyright Copyright (c) 2019 Maxim Khorin (maksimovichu@gmail.com)
 */
'use strict';

const Base = require('areto/base/Base');

module.exports = class ListFilterCondition extends Base {

    static getConstants () {
        return {
            NUMBER_OPERATIONS: ['=', '!=', '<', '>', '<=', '>='],
            DATE_OPERATIONS: ['=', '!=', '<', '>', '<=', '>=']
        };
    }

    constructor (config) {
        super({
            // items: filter data items
            // query: [Query]
            ...config
        });
    }

    async resolve () {
        this.items = this.normalizeItems(this.items);
        for (const item of this.items) {
            item.condition = await this.parse(item);
        }
        let and = ['AND'], or = ['OR', and]; // AND has priority over OR
        for (const item of this.items) {
            if (item.condition) {
                if (!item.and && and.length > 1) {
                    and = ['AND'];
                    or.push(and);
                }
                and.push(item.condition);
            }
        }
        return or.length > 2 ? or : and.length > 1 ? and : null;
    }

    normalizeItems (items) {
        return Array.isArray(items)
            ? items.filter(item => item)
            : this.throwBadRequest('Invalid items');
    }

    parse (data) {
        if (typeof data.attr !== 'string') {
            return this.throwBadRequest('Invalid attribute');
        }
        if (data.owner) {
            return this.parseOwner(data);
        }
        if (data.op === 'nested') {
            return this.parseNested(data);
        }
        if (data.relation) {
            return this.parseRelation(data);
        }
        return this.parseByType(data);
    }

    async parseOwner ({attr, value, owner, relation}) {
        const rel = this.getRelation(owner, this.query.model);
        const condition = await this.parseByType(...arguments);
        const query = rel.model.find(condition);
        if (!relation) { // simple relation without via
            return {[rel.linkKey]: await query.column(rel.refKey)};
        }
        const models = await query.all();
        const result = [];
        for (const model of models) {
            result.push(...await this.getRelation(relation, model).ids());
        }
        return {[this.query.model.PK]: result};
    }

    async parseNested ({attr, value}) {
        const rel = this.getRelation(attr, this.query.model);
        const query = rel.model.find();
        const filter = this.grid.createFilter({items: value, query});
        query.and(await filter.resolve());
        return {[rel.linkKey]: await query.column(rel.refKey)};

        // TODO: resolve .via() relations
    }

    async parseRelation ({attr, op, value, relation}) {
        if (!value) {
            return this.parseEmptyRelation(...arguments);
        }
        const model = this.query.model;
        const related = await this.getRelation(attr, model).model.findById(value).one();
        if (!related) {
            this.throwBadRequest(`Related model not found: ${value}`);
        }
        value = await this.getRelation(relation, related).ids();
        return this.formatSelectorCondition(model.PK, op, value);
    }

    parseEmptyRelation ({relation}) {
        //model.getNotRelatedIds(relation);
        // return Array.isArray(value) ? this.formatSelectorCondition(model.PK, op, value) : null;
        return null;
    }

    getRelation (name, model) {
        return model.getRelation(name) || this.throwBadRequest(`Relation not found: ${name}`);
    }

    parseByType (data) {
        switch (data.type) {
            case 'boolean':
                return this.parseBoolean(data);
            case 'date':
                return this.parseDate(data);
            case 'datetime':
                return this.parseDatetime(data);
            case 'id':
                return this.parseId(data);
            case 'integer':
            case 'float':
            case 'number':
                return this.parseNumber(data);
            case 'string':
                return this.parseString(data);
            case 'selector':
                return this.parseSelector(data);
        }
    }

    parseBoolean (data) {
        return ['=', data.attr, data.value === 'true'];
    }

    parseDate ({attr, op, value}) {
        if (value === '') {
            return this.getEmptyValueCondition(op === '!=', attr);
        }
        const date = DateHelper.getValid(value);
        if (!date) {
            return null;
        }
        date.setHours(0, 0, 0, 0);
        const next = new Date(date.getTime() + 86400000);
        switch (op) {
            case '=': return ['AND', ['>=', attr, date], ['<', attr, next]];
            case '!=': return ['OR', ['<', attr, date], ['>=', attr, next]];
            case '<': return ['<', attr, date];
            case '<=': return ['<', attr, next];
            case '>': return ['>=', attr, next];
            case '>=': return ['>', attr, date];
        }
        this.throwInvalidOperation(op);
    }

    parseDatetime ({attr, op, value}) {
        if (value === '') {
            return this.getEmptyValueCondition(op === '!=', attr);
        }
        const date = DateHelper.getValid(value);
        if (!date) {
            return null;
        }
        return this.DATE_OPERATIONS.includes(op)
            ? [op, attr, date]
            : this.throwInvalidOperation(op);
    }

    parseId ({attr, op, value}) {
        if (value === '') {
            return this.getEmptyValueCondition(op === 'not equal', attr);
        }
        value = this.query.getDb().normalizeId(value);
        switch (op) {
            case 'equal': return {[attr]: value};
            case 'not equal': return ['!=', attr, value];
        }
        this.throwInvalidOperation(op);
    }

    parseNumber ({attr, op, value}) {
        if (value === '') {
            return this.getEmptyValueCondition(op === '!=', attr);
        }
        if (!isFinite(parseFloat(value))) {
            return this.throwInvalidValue(value);
        }
        return this.NUMBER_OPERATIONS.includes(op)
            ? [op, attr, parseFloat(value)]
            : this.throwInvalidOperation(op);
    }

    parseString ({attr, op, value}) {
        if (typeof value !== 'string') {
            return this.throwInvalidValue(value);
        }
        if (value === '') {
            return ['OR', {[attr]: ''}, {[attr]: null}]
        }
        value = EscapeHelper.escapeRegex(value);
        switch (op) {
            case 'equal': value = `^${value}$`; break;
            case 'begins': value = `^${value}`; break;
            case 'ends': value = `${value}$`; break;
            case 'contains': break;
            default: this.throwInvalidOperation(op);
        }
        return ['LIKE', attr, new RegExp(value, 'i')];
    }

    parseSelector ({attr, op, value}) {
        if (value === '') {
            return this.getEmptyValueCondition(op === 'not equal', attr);
        }
        value = this.formatByValueType(...arguments);
        return value ? this.formatSelectorCondition(attr, op, value) : null;
    }

    getEmptyValueCondition (isNotEqual, attr) {
        return isNotEqual ? ['NOT EQUAL', attr, null] : {[attr]: null};
    }

    formatByValueType ({value, valueType}) {
        switch (valueType) {
            case 'id': return this.query.getDb().normalizeId(value);
            case 'integer': return parseInt(value);
        }
        return value;
    }

    formatSelectorCondition (attr, op, value) {
        if (op === 'equal') {
            return {[attr]: value};
        }
        if (op === 'not equal') {
            return ['NOT IN', attr, value];
        }
        this.throwInvalidOperation(op);
    }

    throwInvalidOperation (message) {
        this.throwBadRequest(`Invalid operation: ${message}`);
    }

    throwInvalidValue (message) {
        this.throwBadRequest(`Invalid value: ${message}`);
    }

    throwBadRequest (message) {
        throw new BadRequest(this.wrapClassMessage(message));
    }
};
module.exports.init();

const BadRequest = require('areto/error/BadRequestHttpException');
const EscapeHelper = require('areto/helper/EscapeHelper');
const DateHelper = require('areto/helper/DateHelper');