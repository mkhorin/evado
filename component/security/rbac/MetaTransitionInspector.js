/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const Base = require('areto/security/rbac/Inspector');

module.exports = class MetaTransitionInspector extends Base {

    /**
     * metaTransitionData
     * role:
     *   key [... items]
     */

    static concatHierarchyItems (items, data) {
        const ALL = '...';
        for (const item of items) {
            if (!item.transition && !item.object && item.class) {
                Rbac.concatFirstArrayItems(item.key, data, ALL);
            }
        }
        for (const item of items) {
            if (!item.transition && item.object) {
                Rbac.concatFirstArrayItems(item.key, data, `..${item.class}`, ALL);
            }
        }
        for (const item of items) {
            if (item.transition && item.object) {
                Rbac.concatFirstArrayItems(item.key, data, `${item.transition}..${item.class}`);
            }
        }
        return data;
    }

    static intersectData (d1, d2) {
        const result = {};
        for (const key of ArrayHelper.intersect(Object.keys(d1), Object.keys(d2))) {
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
        const items = this.itemMap[this.objectKey]
            || this.itemMap[this.classKey]
            || this.itemMap[`...${this.target.class}`]
            || this.itemMap[`...`];
        if (!await this.checkItems(items)) {
            return this.resolveTransitions();
        }
    }

    filterMetaData (data) {
        let result;
        for (const role of this.assignments) {
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
            for (const transition of this.transitions) {
                const items = this.itemMap[transition.name + this.objectKey]
                    || this.itemMap[transition.name + this.classKey];
                if (!await this.checkItems(items)) {
                    this.target.transitions.push(transition);
                }
            }
        }
    }

    async checkItems (items) {
        if (Array.isArray(items)) {
            for (const item of items) {
                if(!item.rule || await this.checkRule(item.rule)) {
                    return true;
                }
            }
        }
    }
};

const ArrayHelper = require('areto/helper/ArrayHelper');
const Rbac = require('./Rbac');