'use strict';

const Base = require('../misc/ListFilterCondition');

module.exports = class ListFilterCondition extends Base {

    parse (data) {
        let attr = this.view.getAttr(data.attr);
        if (this.view.searchAttrs.includes(attr)) {
            return super.parse(data);
        }
        throw new BadRequest(this.wrapClassMessage(`Invalid search attribute: ${data.attr}.${this.view.id}`));
    }

    parseRelation (data) {
        let attr = data.attr;
        let rel = this.getRelation(attr);
        let value = this.formatByValueType(data);
        if (!value) {
            return null;
        }
        if (rel.isBackRef()) {
            let query = rel.refClass.find().and({[rel.refClass.getKey()]: value});
            value = this.getRelationValue(rel, query);
            attr = rel.linkAttrName;
        }
        return this.formatSelectorCondition(data.operation, attr, value);
    }

    async parseNested (data) {
        let attr = data.attr, value;
        let rel = this.getRelation(attr);
        let query = rel.refClass.find();
        let condition = await (new this.constructor({
            view: rel.attr.getRefView('searchView', 'list'),
            items: data.value,
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
        if (!attr.getRel()) {
            throw new BadRequest(this.wrapClassMessage(`Invalid relation: ${attr.id}`));
        }
        return attr.getRel();
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