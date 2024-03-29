/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const Base = require('areto/base/Base');

module.exports = class HierarchySolver extends Base {

    static getCircularError (model) {
        return this.wrapClassMessage(`Circular inheritance in ${model.constructor.name}`);
    }

    /**
     * @param {Object} config
     * @param {Object} config.model - ActiveRecord instance
     */
    constructor (config) {
        super({
            parentAttr: 'parent',
            ...config
        });
    }

    async getDescendantAndParentQuery () {
        const root = this.model.getId();
        const ids = await this.getDescendantAndParentIds([root]);
        return this.model.find({[this.model.PK]: ids}, ...arguments);
    }

    async getDescendantQuery () {
        const root = this.model.getId();
        const ids = await this.getDescendantIds([root]);
        return this.model.find({[this.model.PK]: ids}, ...arguments);
    }

    async getParentQuery () {
        let descendants = [];
        let id = this.model.getId();
        if (id) {
            descendants = await this.getDescendantIds([id]);
            descendants.push(id);
        }
        return this.model.find(['notIn', this.model.PK, descendants], ...arguments);
    }

    async getDescendantAndParentIds (parentIds) {
        const descendants = await this.getDescendantIds(parentIds);
        descendants.push(...parentIds);
        return descendants;
    }

    async getDescendantIds (parentIds) {
        const query = this.model.find({[this.parentAttr]: parentIds});
        const children = await query.column(this.model.PK);
        if (children.length === 0) {
            return children;
        }
        if (ArrayHelper.includes(this.model.getId(), children)) {
            const message = this.constructor.getCircularError(this.model);
            throw new Error(message);
        }
        const descendants = await this.getDescendantIds(children);
        return children.concat(descendants);
    }

    /**
     * Get ancestors ordered from root to parent
     */
    async getAncestors (child) {
        child = child || this.model;
        const parent = child.get(this.parentAttr);
        if (!parent) {
            return [];
        }
        const query = child.findById(parent).with(this.with);
        const item = await query.one();
        if (!item) {
            return [];
        }
        if (this.model.getId().equals(item.getId())) {
            const message = this.constructor.getCircularError(this.model);
            throw new Error(message);
        }
        const ancestors = await this.getAncestors(item);
        ancestors.push(item);
        return ancestors;
    }

    async getParentSelectItems (query, textKey) {
        let descendants = [];
        let id = this.model.getId();
        if (id ) {
            descendants = await this.getDescendantIds([id]);
            descendants.push(id);
        }
        query = query.andNotIn(this.model.PK, descendants);
        return this.model.constructor.getSelectItemsByQuery(query, this.model.PK, textKey);
    }
};

const ArrayHelper = require('areto/helper/ArrayHelper');