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
        for (const key of ArrayHelper.intersect(Object.keys(d1), Object.keys(d2))) {
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
        const forbiddenSection = data.hasOwnProperty(this.section.id)
            ? await this.checkItems(data[this.section.id]) // check deny
            : false;
        if (forbiddenSection) {
            return {[this.section.id]: true};
        }
        const forbiddenAccess = {};
        for (const item of this.items) {
            if (data[item.id]) {
                forbiddenAccess[item.id] = await this.checkItems(data[item.id]);
            }
        }
        return forbiddenAccess;
    }

    filterMeta (data) {
        let result;
        for (const role of this.assignments) {
            if (!Object.prototype.hasOwnProperty.call(data, role)) {
                return null; // no role data
            }
            result = result
                ? this.constructor.intersectData(result, data[role])
                : data[role];
        }
        return Object.values(result).length ? result : null;
    }

    async checkItems (items) {
        if (Array.isArray(items)) {
            for (const {rules} of items) {
                if (!rules || await this.checkRules(rules)) {
                    return true;
                }
            }
        }
    }
};

const ArrayHelper = require('areto/helper/ArrayHelper');