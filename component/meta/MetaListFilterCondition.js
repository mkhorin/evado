/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const Base = require('../misc/ListFilterCondition');

module.exports = class MetaListFilterCondition extends Base {

    parse ({attr}) {
        if (this.view.searchAttrs.includes(this.view.getAttr(attr))) {
            return super.parse(...arguments);
        }
        throw new BadRequest(this.wrapClassMessage(`Invalid search attribute: ${attr}.${this.view.id}`));
    }

    parseRelation ({attr, operation}) {
        let rel = this.getRelation(attr);
        let value = this.formatByValueType(...arguments);
        if (!value) {
            return null;
        }
        if (rel.isBackRef()) {
            let query = rel.refClass.find().and({[rel.refClass.getKey()]: value});
            value = this.getRelationValue(rel, query);
            attr = rel.linkAttrName;
        }
        return this.formatSelectorCondition(attr, operation, value);
    }

    async parseNested ({attr, value}) {
        let rel = this.getRelation(attr);
        let query = rel.refClass.find();
        let condition = await (new this.constructor({
            view: rel.attr.getRefView('searchView', 'list'),
            items: value,
            query
        })).resolve();
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
        let attr = this.view.getAttr(name);
        if (attr.rel) {
            return attr.rel;
        }
        throw new BadRequest(this.wrapClassMessage(`Invalid relation: ${attr.id}`));
    }

    async getRelationValue (rel, query) {
        let values = await query.column(rel.refAttrName);
        let result = [];
        for (let value of values) {
            if (value !== null) {
                result.push(value);
            }
        }
        return ArrayHelper.concatValues(result);
    }
};

const ArrayHelper = require('areto/helper/ArrayHelper');
const BadRequest = require('areto/error/BadRequestHttpException');