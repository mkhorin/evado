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

    isNested (item) {
        return item.operation === 'nested';
    }

    async resolve () {
        this.items = this.normalizeItems(this.items);
        for (let item of this.items) {
            item.condition = await this.parse(item);
        }
        let and = ['AND'], or = ['OR', and]; // AND has priority over OR
        for (let item of this.items) {
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
        if (!Array.isArray(items)) {
            throw new BadRequest(this.wrapClassMessage('Invalid items'));
        }
        return items.filter(item => item).map(this.normalizeItem, this);
    }

    normalizeItem (data) {
        return {
            type: data.type,
            attr: data.attr,
            and: data.and,
            operation: data.op,
            value: data.val,
            valueType: data.valType,
            relation: data.rel
        };
    }

    parse (data) {
        if (typeof data.attr !== 'string') {
            throw new BadRequest(this.wrapClassMessage('Invalid attribute'));
        }
        if (this.isNested(data)) {
            return this.parseNested(data);
        }
        if (data.relation) {
            return this.parseRelation(data);
        }
        switch (data.type) {
            case 'boolean':
                return this.parseBoolean(data);
            case 'date':
            case 'datetime':
                return this.parseDate(data);
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

    parseDate ({attr, operation, value}) {
        if (value === '') {
            return operation === '!=' ? ['NOT EQUAL', attr, null] : {[attr]: null};
        }
        const date = DateHelper.getValid(value);
        if (!date) {
            return null;
        }
        if (!this.DATE_OPERATIONS.includes(operation)) {
            this.throwInvalidOperation(operation);
        }
        return [operation, attr, date];
    }

    parseId ({attr, operation, value}) {
        if (value === '') {
            return operation === 'not equal' ? ['NOT EQUAL', attr, null] : {[attr]: null};
        }
        value = this.query.getDb().normalizeId(value);
        switch (operation) {
            case 'equal': return {[attr]: value};
            case 'not equal': return ['!=', attr, value];
        }
        this.throwInvalidOperation(operation);
    }

    parseNumber ({attr, operation, value}) {
        if (value === '') {
            return operation === '!=' ? ['NOT EQUAL', attr, null] : {[attr]: null};
        }
        if (!isFinite(parseFloat(value))) {
            this.throwInvalidValue(value);
        }
        if (!this.NUMBER_OPERATIONS.includes(operation)) {
            this.throwInvalidOperation(operation);
        }
        return [operation, attr, parseFloat(value)];
    }

    parseString ({attr, operation, value}) {
        if (typeof value !== 'string') {
            this.throwInvalidValue(value);
        }
        if (value === '') {
            return ['OR', {[attr]: ''}, {[attr]: null}]
        }
        value = EscapeHelper.escapeRegExp(value);
        switch (operation) {
            case 'equal': value = `^${value}$`; break;
            case 'begins': value = `^${value}`; break;
            case 'ends': value = `${value}$`; break;
            case 'contains': break;
            default: this.throwInvalidOperation(operation);
        }
        return ['LIKE', attr, new RegExp(value, 'i')];
    }

    parseSelector ({attr, operation, value}) {
        if (value === '') {
            return operation === 'not equal' ? ['NOT EQUAL', attr, null] : {[attr]: null};
        }
        value = this.formatByValueType(...arguments);
        return value ? this.formatSelectorCondition(attr, operation, value) : null;
    }

    parseNested (data) {
        let model = this.query.model;
        // TODO
    }

    async parseRelation ({attr, operation, value, relation}) {
        if (!value) {
            value = this.query.model.getIdsWithEmptyRelation(attr);
            return Array.isArray(value)
                ? this.formatSelectorCondition(this.query.model.PK, operation, value)
                : null;
        }
        const query = this.getRelationQuery(attr, this.query.model);
        const related = await query.model.findById(value).one();
        if (!related) {
            throw new BadRequest(this.wrapClassMessage(`Not found related model: ${value}`));
        }
        const values = await this.getRelationQuery(relation, related).ids();
        return values.length
            ? this.formatSelectorCondition(this.query.model.PK, operation, values)
            : null;
    }

    getRelationQuery (name, model) {
        const query = model.getRelation(name);
        if (!query) {
            throw new BadRequest(this.wrapClassMessage(`Not found relation: ${name}`));    
        }
        return query;        
    }

    formatByValueType ({value, valueType}) {
        switch (valueType) {
            case 'id': return this.query.getDb().normalizeId(value);
            case 'integer': return parseInt(value);
        }
        return value;
    }

    formatSelectorCondition (attr, operation, value) {
        if (operation === 'equal') {
            return {[attr]: value};
        }
        if (operation === 'not equal') {
            return ['NOT IN', attr, value];
        }
        this.throwInvalidOperation(operation);
    }

    throwInvalidOperation (data) {
        throw new BadRequest(this.wrapClassMessage(`Invalid operation: ${data}`));
    }

    throwInvalidValue (data) {
        throw new BadRequest(this.wrapClassMessage(`Invalid value: ${data}`));
    }
};
module.exports.init();

const BadRequest = require('areto/error/BadRequestHttpException');
const EscapeHelper = require('areto/helper/EscapeHelper');
const DateHelper = require('areto/helper/DateHelper');