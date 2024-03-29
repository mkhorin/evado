/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 *
 * metaNavMap (only DENY and READ and [SECTION, NODE])
 *  role
 *    id: []
 */
'use strict';

const Base = require('areto/security/rbac/Inspector');

module.exports = class MetaNavInspector extends Base {

    static intersectData (d1, d2) {
        const result = {};
        const keys = ArrayHelper.intersect(Object.keys(d1), Object.keys(d2));
        for (const key of keys) {
            result[key] = d1[key].concat(d2[key]);
        }
        return result;
    }

    async execute () {
        if (!this.rbac.metaNavMap) {
            return {};
        }
        const data = this.filterMeta(this.rbac.metaNavMap);
        if (!data) {
            return {};
        }
        const forbiddenSection = Object.hasOwn(data, this.section.id)
            ? await this.checkItems(data[this.section.id]) // check deny
            : false;
        if (forbiddenSection) {
            return {[this.section.id]: true};
        }
        return this.params.withParents
            ? this.getForbiddenAccessWithParents(data)
            : this.getForbiddenAccess(data);
    }

    async getForbiddenAccessWithParents (data) {
        const result = {};
        for (const item of this.items) {
            if (item.parent) {
                const parents = item.getParents();
                result[item.id] = await this.checkParents(parents, data, result);
            }
            if (!result[item.id] && data[item.id]) {
                result[item.id] = await this.checkItems(data[item.id]);
            }
        }
        return result;
    }

    async checkParents (parents, data, forbiddenAccess) {
        for (let i = parents.length - 1; i >= 0; --i) { // start from the root
            let id = parents[i].id;
            if (!Object.hasOwn(forbiddenAccess, id)) {
                forbiddenAccess[id] = data[id]
                    ? await this.checkItems(data[id])
                    : false;
            }
            if (forbiddenAccess[id]) {
                return true;
            }
        }
        return false;
    }

    async getForbiddenAccess (data) {
        const result = {};
        for (const item of this.items) {
            if (data[item.id]) {
                result[item.id] = await this.checkItems(data[item.id]);
            }
        }
        return result;
    }

    filterMeta (data) {
        let result = null;
        for (const role of this.assignments) {
            if (!Object.hasOwn(data, role)) {
                return null; // no role data
            }
            result = result
                ? this.constructor.intersectData(result, data[role])
                : data[role];
        }
        return result && Object.values(result).length ? result : null;
    }

    async checkItems (items) {
        if (Array.isArray(items)) {
            for (const {rules} of items) {
                if (!rules || await this.checkRules(rules)) {
                    return true;
                }
            }
        }
        return false;
    }
};

const ArrayHelper = require('areto/helper/ArrayHelper');