/**
 * @copyright Copyright (c) 2019 Maxim Khorin (maksimovichu@gmail.com)
 */
'use strict';

const Base = require('areto/base/Base');

module.exports = class CommonSearch extends Base {

    static getConstants () {
        return {
            CONDITION_METHODS: this.getConditionMethods()
        };
    }

    static getConditionMethods () {
        return {
            float: 'getNumberTypeCondition',
            date: 'getDateTypeCondition',
            datetime: 'getDateTypeCondition',
            id: 'getIdTypeCondition',
            integer: 'getNumberTypeCondition',
            number: 'getNumberTypeCondition',
            timestamp: 'getDateTypeCondition',
            title: 'getTitleTypeCondition'
        };
    }

    async resolve (query, value) {
        this.conditions = [];
        this.query = query;
        for (const column of this.columns) {
            if (column.searchable === true) {
                await this.resolveCondition(column, value);
            }
        }
        if (this.conditions.length) {
            query.and(['or', ...this.conditions]);
        }
    }

    async resolveCondition (column, value) {
        const method = this[this.CONDITION_METHODS[column.type]] || this.getDefaultTypeCondition;
        const condition = method.call(this, column.name, value, column);
        if (!condition) {
            return null;
        }
        if (!column.relation) {
            return this.conditions.push(condition);
        }
        const name = column.relation === true ? column.name : column.relation;
        const relation = this.query.model.getRelation(name);
        if (!relation) {
            return this.throwBadRequest(`Relation not found: ${name}`);
        }
        // relation without via
        const query = relation.model.find(condition);
        this.conditions.push({[relation.linkKey]: await query.column(relation.refKey)});
    }

    getDefaultTypeCondition (attr, value) {
        value = EscapeHelper.escapeRegex(value);
        return ['like', attr, new RegExp(value, 'i')];
    }

    getDateTypeCondition (attr, value) {
        value = DateHelper.parse(value, this.controller.language);
        value = DateHelper.getDayInterval(value);
        return value ? ['and', ['>=', attr, value[0]], ['<', attr, value[1]]] : null;
    }

    getIdTypeCondition (attr, value) {
        value = this.query.getDb().normalizeId(value);
        return value ? {[attr]: value} : null;
    }

    getNumberTypeCondition (attr, value) {
        value = Number(value);
        return isNaN(value) ? null : {[attr]: value};
    }

    getTitleTypeCondition (attr, value) {
        value = new RegExp(EscapeHelper.escapeRegex(value), 'i');
        return ['or', ['like', 'name', value], ['like', 'label', value]];
    }
};
module.exports.init();

const EscapeHelper = require('areto/helper/EscapeHelper');
const DateHelper = require('areto/helper/DateHelper');