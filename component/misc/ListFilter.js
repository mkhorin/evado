/**
 * @copyright Copyright (c) 2019 Maxim Khorin (maksimovichu@gmail.com)
 */
'use strict';

const Base = require('areto/base/Base');

module.exports = class ListFilter extends Base {

    static getConstants () {
        return {
            NUMBER_OPERATIONS: ['=', '!=', '<', '>', '<=', '>='],
            DATE_OPERATIONS: ['=', '!=', '<', '>', '<=', '>=']
        };
    }

    async resolve () {
        const conditions = await this.resolveItems(this.items);
        this.query.and(conditions);
    }

    async resolveItems (items) {
        items = this.normalizeItems(items);
        for (const item of items) {
            item.condition = await this.parse(item);
        }
        let and = ['and'], or, prev;
        for (const item of items) {
            if (!item.condition) {
                continue;
            }
            if (item.or) {
                if (!or) {
                    or = ['or'];
                    if (prev) {
                        or.push(prev.condition);
                    }
                }
                or.push(item.condition);
            } else if (or) {
                and.push(or);
                or = null;
            } else if (prev) {
                and.push(prev.condition);
            }
            prev = item;
        }
        if (or) {
            and.push(or);
        } else if (prev) {
            and.push(prev.condition);
        }
        if (and.length === 2) {
            return and[1];
        }
        if (and.length > 2) {
            return and;
        }
    }

    normalizeItems (items) {
        if (!Array.isArray(items)) {
            items = [items];
        }
        return items.filter(item => item);
    }

    parse (data) {
        if (data.items) {
            return this.parseNestedCondition(data);
        }
        if (data.owner) {
            return this.parseOwner(data);
        }
        if (data.op === 'nested') {
            return this.parseNestedOperation(data);
        }
        if (data.relation) {
            return this.parseRelation(data);
        }
        return this.parseByType(data);
    }

    async parseNestedCondition ({items}) {
        return Array.isArray(items)
            ? this.resolveItems(items)
            : this.throwBadRequest('Invalid nested condition');
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
            const ids = await this.getRelation(relation, model).ids();
            result.push(...ids);
        }
        return {[this.query.model.PK]: result};
    }

    async parseNestedOperation ({attr, relation, value: items}) {
        let rel = this.getRelation(attr, this.query.model);
        let query = rel.model.createQuery();
        await this.spawnSelf({items, query}).resolve();
        if (!relation) {
            const ids = await query.column(rel.refKey);
            return {[rel.linkKey]: ids};
        }
        rel = this.getRelation(relation, rel.model);
        const models = await query.with(relation).all();
        const ids = [];
        for (const model of models) {
            const related = model.rel(relation);
            if (Array.isArray(related)) {
                for (const model of related) {
                    ids.push(model.getId());
                }
            } else if (related) {
                ids.push(related.getId());
            }
        }
        return {[rel.refKey]: ids};
    }

    async parseRelation ({attr, op, value, relation}) {
        if (!value) {
            return this.parseEmptyRelation(...arguments);
        }
        const {model} = this.query;
        const query = this.getRelation(attr, model).model.findById(value);
        const relative = await query.one();
        if (!relative) {
            this.throwBadRequest(`Related object not found: ${value}`);
        }
        value = await this.getRelation(relation, relative).ids();
        return this.formatSelectorCondition(model.PK, op, value);
    }

    parseEmptyRelation ({relation}) {
        return null;
    }

    getRelation (name, model) {
        return model.getRelation(name)
            || this.throwBadRequest(`Relation not found: ${name}`);
    }

    parseByType (data) {
        switch (data.type) {
            case 'boolean': {
                return this.parseBoolean(data);
            }
            case 'date': {
                return this.parseDate(data);
            }
            case 'datetime': {
                return this.parseDatetime(data);
            }
            case 'id': {
                return this.parseId(data);
            }
            case 'integer':
            case 'float':
            case 'number': {
                return this.parseNumber(data);
            }
            case 'string': {
                return this.parseString(data);
            }
            case 'selector': {
                return this.parseSelector(data);
            }
        }
    }

    parseBoolean ({value, attr}) {
        return [value === 'true' ? '=' : '!=', attr, true];
    }

    parseDate ({attr, op, value}) {
        if (value === '') {
            return this.getEmptyValueCondition(attr, op);
        }
        const date = DateHelper.getValid(value);
        if (!date) {
            return null;
        }
        date.setHours(0, 0, 0, 0);
        const next = new Date(date.getTime() + 86400000); // ms per day
        switch (op) {
            case '=': return ['and', ['>=', attr, date], ['<', attr, next]];
            case '!=': return ['or', ['<', attr, date], ['>=', attr, next]];
            case '<': return ['<', attr, date];
            case '<=': return ['<', attr, next];
            case '>': return ['>=', attr, next];
            case '>=': return ['>', attr, date];
        }
        this.throwInvalidOperation(op);
    }

    parseDatetime ({attr, op, value}) {
        if (value === '') {
            return this.getEmptyValueCondition(attr, op);
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
            return this.getEmptyValueCondition(attr, op);
        }
        value = this.query.getDb().normalizeId(value);
        switch (op) {
            case 'equal': return {[attr]: value};
            case 'notEqual': return ['!=', attr, value];
        }
        this.throwInvalidOperation(op);
    }

    parseNumber ({attr, op, value}) {
        if (value === '') {
            return this.getEmptyValueCondition(attr, op);
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
            return ['or', {[attr]: ''}, {[attr]: null}]
        }
        if (op === 'equal') {
            return {[attr]: value};
        }
        if (op === 'notEqual') {
            return ['!=', attr, value];
        }
        if (op === 'regex') {
            return {[attr]: new RegExp(value)};
        }
        value = EscapeHelper.escapeRegex(value);
        switch (op) {
            case 'contains': {
                break;
            }
            case 'equalCaseInsensitive': {
                value = `^${value}$`;
                break;
            }
            case 'notEqualCaseInsensitive': {
                value = `^((?!${value}).)*$`;
                break;
            }
            case 'begins': {
                value = `^${value}`;
                break;
            }
            case 'ends': {
                value = `${value}$`;
                break;
            }
            case 'lt': {
                return ['<', attr, value];
            }
            case 'gt': {
                return ['>', attr, value];
            }
            default: {
                return this.throwInvalidOperation(op);
            }
        }
        return {[attr]: new RegExp(value, 'i')};
    }

    parseSelector ({attr, op, value, valueType}) {
        if (value === '') {
            return this.getEmptyValueCondition(attr, op);
        }
        value = this.formatByValueType(value, valueType);
        return value
            ? this.formatSelectorCondition(attr, op, value)
            : null;
    }

    getEmptyValueCondition (attr, op) {
        op = op === '!=' || op === 'notEqual' ? 'notIn' : 'in';
        return [op, attr, [null, '']];
    }

    formatByValueType (value, type) {
        switch (type) {
            case 'id': return this.query.getDb().normalizeId(value);
            case 'integer': return parseInt(value);
            case 'number': return parseFloat(value);
        }
        return value;
    }

    formatSelectorCondition (attr, op, value) {
        if (op === 'equal') {
            return {[attr]: value};
        }
        if (op === 'notEqual') {
            return [Array.isArray(value) ? 'notIn' : op, attr, value];
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

const BadRequest = require('areto/error/http/BadRequest');
const EscapeHelper = require('areto/helper/EscapeHelper');
const DateHelper = require('areto/helper/DateHelper');