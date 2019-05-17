'use strict';

const Base = require('areto/rbac/Inspector');

module.exports = class MetaTransitionInspector extends Base {

    /**
     * metaTransitionData
     * role:
     *   key [... items]
     */

    static concatHierarchyItems (items, map) {
        const ALL = '...';
        for (let item of items) {
            if (!item.transition && !item.object && item.class) {
                Rbac.concatFirstArrayItems(item.key, map, ALL);
            }
        }
        for (let item of items) {
            if (!item.transition && item.object) {
                Rbac.concatFirstArrayItems(item.key, map, `..${item.class}`, ALL);
            }
        }
        for (let item of items) {
            if (item.transition && item.object) {
                Rbac.concatFirstArrayItems(item.key, map, `${item.transition}..${item.class}`);
            }
        }
        return map;
    }

    static intersectData (d1, d2) {
        let result = {};
        for (let key of ArrayHelper.intersect(Object.keys(d1), Object.keys(d2))) {
            result[key] = d1[key].concat(d2[key]);
        }
        return result;
    }

    async execute () {
        this.transitions = this.target.transitions;
        if (!this.transitions || !this.transitions.length || !this.rbac.metaTransitionMap) {
            return false;
        }
        this.itemMap = this.filterMetaData(this.rbac.metaTransitionMap);
        if (!this.itemMap) {
            return false;
        }
        this.target.transitions = [];
        this.targetId = this.target.getId().toString();
        this.objectKey = `.${this.targetId}.${this.target.class.id}`;
        this.classKey = `..${this.target.class.id}`;
        let items = this.itemMap[this.objectKey]
            || this.itemMap[this.classKey]
            || this.itemMap[`...${this.target.class}`]
            || this.itemMap[`...`];
        if (!await this.checkItems(items)) {
            return this.resolveTransitions();
        }
    }

    filterMetaData (data) {
        let result;
        for (let role of this.assignments) {
            if (!Object.prototype.hasOwnProperty.call(data, role)) {
                return null; // no filter to role
            }
            result = result
                ? this.constructor.intersectData(result, data[role])
                : data[role];
        }
        return Object.values(result).length ? result : null;
    }

    async resolveTransitions () {
        if (Array.isArray(this.transitions)) {
            for (let transition of this.transitions) {
                let items = this.itemMap[transition.name + this.objectKey]
                    || this.itemMap[transition.name + this.classKey];
                if (!await this.checkItems(items)) {
                    this.target.transitions.push(transition);
                }
            }
        }
    }

    async checkItems (items) {
        if (Array.isArray(items)) {
            for (let item of items) {
                if(!item.rule || await this.checkRule(item.rule)) {
                    return true;
                }
            }
        }
    }
};

const ArrayHelper = require('areto/helper/ArrayHelper');
const Rbac = require('./Rbac');