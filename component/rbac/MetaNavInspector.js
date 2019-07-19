/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const Base = require('areto/rbac/Inspector');

module.exports = class MetaNavInspector extends Base {

    /**
     * metaNavMap  [only DENY and READ and [NAV_SECTION, NAV_NODE]]
     * role
     *    id: []
     */

    static intersectData (d1, d2) {
        let result = {};
        for (let key of ArrayHelper.intersect(Object.keys(d1), Object.keys(d2))) {
            result[key] = d1[key].concat(d2[key]);
        }
        return result;
    }

    async execute () {
        if (!this.rbac.metaNavMap) {
            return {};
        }
        let data = this.filterMetaData(this.rbac.metaNavMap);
        if (!data) {
            return {};
        }
        let forbiddenSection = data.hasOwnProperty(this.section.id)
            ? await this.checkItems(data[this.section.id]) // check deny
            : false;
        if (forbiddenSection) {
            return {[this.section.id]: true};
        }
        let forbiddenAccess = {};
        for (let item of this.items) {
            if (data[item.id]) {
                forbiddenAccess[item.id] = await this.checkItems(data[item.id]);
            }
        }
        return forbiddenAccess;
    }

    filterMetaData (data) {
        let result;
        for (let role of this.assignments) {
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
            for (let item of items) {
                if (!item.rule || await this.checkRule(item.rule)) {
                    return true;
                }
            }
        }
    }
};

const ArrayHelper = require('areto/helper/ArrayHelper');