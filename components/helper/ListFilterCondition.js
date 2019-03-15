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
            // query: Query
            ...config
        });
    }

    isNested (item) {
        return item.operation === 'nested';
    }

    async resolve () {
        this.normalizeItems();
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

    normalizeItems () {
        if (!Array.isArray(this.items)) {
            throw new BadRequest(this.wrapClassMessage('Invalid items'));
        }
        this.items = this.items.filter(item => !!item);
        this.items = this.items.map(item => ({
            'type': item.type,
            'attr': item.attr,
            'and': item.and === 'true',
            'operation': item.op,
            'value': item.val,
            'valueType': item.valType,
            'relation': item.rel === 'true' ? item.attr : item.rel
        }));
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

    parseDate (data) {
        let date = DateHelper.getValid(data.value);
        if (!date) {
            return null;
        }
        if (!this.DATE_OPERATIONS.includes(data.operation)) {
            this.throwInvalidOperation(data.operation);
        }
        return [data.operation, data.attr, date];
    }

    parseId (data) {
        let value = this.query.getDb().normalizeId(data.value);
        switch (data.operation) {
            case 'equal': return {[data.attr]: data.value};
            case 'not equal': return ['!=', data.attr, data.value];
        }
        this.throwInvalidOperation(data.operation);
    }

    parseNumber (data) {
        let value = parseFloat(data.value);
        if (!isFinite(value)) {
            this.throwInvalidValue(data.value);
        }
        if (!this.NUMBER_OPERATIONS.includes(data.operation)) {
            this.throwInvalidOperation(data.operation);
        }
        return [data.operation, data.attr, value];
    }

    parseString (data) {
        let value = data.value;
        if (typeof value !== 'string' || !value.length) {
            return null;
        }
        value = CommonHelper.escapeRegExp(value);
        switch (data.operation) {
            case 'equal': value = `^${value}$`; break;
            case 'begins': value = `^${value}`; break;
            case 'ends': value = `${value}$`; break;
            case 'contains': break;
            default: this.throwInvalidOperation(data.operation);
        }
        return ['LIKE', data.attr, new RegExp(value, 'i')];
    }

    parseSelector (data) {
        let value = this.formatByValueType(data);
        return value && this.formatSelectorCondition(data.operation, data.attr, value);
    }


    parseNested (data) {
        let model = this.query.model;
        let query = this.getRelationQuery(data.relation || data.attr);
        // TODO
    }

    parseRelation (data) {
        let query = this.getRelationQuery(data.relation);
        // TODO
    }

    getRelationQuery (name) {
        let query = this.query.model.getRelation(name);
        if (!query) {
            throw new BadRequest(this.wrapClassMessage(`Not found relation: ${name}`));
        }
        return query;
    }

    formatByValueType (data) {
        let value = data.value;
        switch (data.valueType) {
            case 'id': return this.query.getDb().normalizeId(value);
            case 'integer': return parseInt(value);
        }
        return value;
    }

    formatSelectorCondition (operation, attr, value) {
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
const CommonHelper = require('areto/helper/CommonHelper');
const DateHelper = require('areto/helper/DateHelper');