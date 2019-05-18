'use strict';

const Base = require('areto/rbac/Inspector');

module.exports = class MetaNavInspector extends Base {

    /**
     * metaNavMap  [only DENY and READ and [NAV_SECTION, NAV_ITEM]]
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
        let deniedAccess = {};
        let data = this.filterMetaData(this.rbac.metaNavMap);
        if (!data) {
            return deniedAccess;
        }
        let deniedSection = data.hasOwnProperty(this.section.id)
            ? await this.checkItems(data[this.section.id]) // check deny
            : false;

        if (deniedSection) {
            deniedAccess[this.section.id] = true;
            return deniedAccess;
        }
        for (let item of this.items) {
            if (data[item.id]) {
                deniedAccess[item.id] = await this.checkItems(data[item.id]);
            }
        }
        return deniedAccess;
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
const Rbac = require('./Rbac');