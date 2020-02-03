/**
 * @copyright Copyright (c) 2019 Maxim Khorin (maksimovichu@gmail.com)
 */
'use strict';

const Base = require('areto/base/Base');

module.exports = class CommonSearch extends Base {

    async resolve (query, value) {
        const conditions = [], ownerMap = {};
        this.query = query;
        for (const column of this.columns) {
            if (column.searchable === true) {
                const condition = this.getConditionByType(column.type, column.name, value);
                if (condition) {
                    column.owner
                        ? ObjectHelper.push(condition, column.owner, ownerMap)
                        : conditions.push(condition);
                }
            }
        }
        for (const name of Object.keys(ownerMap)) {
            conditions.push(await this.resolveOwnerConditions(name, ownerMap[name]));
        }
        if (conditions.length) {
            query.and(['OR', ...conditions]);
        }
    }

    async resolveOwnerConditions (owner, conditions) {
        const relation = this.query.model.getRelation(owner);
        if (!relation) {
            return this.throwBadRequest(`Relation not found: ${owner}`);
        }
        const query = relation.model.find(...conditions);
        // simple relation without via
        return {[relation.linkKey]: await query.column(relation.refKey)};
    }

    getConditionByType (type, attr, value) {
        switch (type) {
            case 'number':
            case 'integer':
            case 'float': {
                value = Number(value);
                return isNaN(value) ? null : {[attr]: value};
            }
            case 'date':
            case 'datetime':
            case 'timestamp': {
                value = DateHelper.parse(value, this.controller.language);
                value = DateHelper.getDayInterval(value);
                return value ? ['AND', ['>=', attr, value[0]], ['<', attr, value[1]]] : null;
            }
            case 'id': {
                value = this.query.getDb().normalizeId(value);
                return value ? {[attr]: value} : null;
            }
        }
        value = EscapeHelper.escapeRegex(value);
        return ['LIKE', attr, new RegExp(value, 'i')];
    }
};
module.exports.init();

const EscapeHelper = require('areto/helper/EscapeHelper');
const DateHelper = require('areto/helper/DateHelper');
const ObjectHelper = require('areto/helper/ObjectHelper');