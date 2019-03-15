'use strict';

const Base = require('areto/rbac/Inspector');

module.exports = class MetaNavInspector extends Base {

    /**
     * metaNavData
     * role:
     *   key [... items]
     */

    static intersectData (d1, d2) {
        let result = {};
        for (let key of ArrayHelper.intersect(Object.keys(d1), Object.keys(d2))) {
            result[key] = d1[key].concat(d2[key]);
        }
        return result;
    }

    async execute (data) {
        if (!this.rbac.metaNavMap) {
            return null;
        }
        this.metaNavMap = this.filterMetaData(this.rbac.metaNavMap);
        if (!this.metaNavMap) {
            return null;
        }
        this.access = {};
        if (data.sections instanceof Array) {
            await this.resolveNavSections(data.sections);
        }
        if (data.items instanceof Array) {
            await this.resolveNavItems(data.items);
        }
        return this.access;
    }

    filterMetaData (data) {
        let result;
        for (let role of this.assignments) {
            if (!Object.prototype.hasOwnProperty.call(data, role)) {
                return null; // no nav filter to role
            }
            result = result
                ? this.constructor.intersectData(result, data[role])
                : data[role];
        }
        return Object.values(result).length ? result : null;
    }

    async resolveNavSections (sections) {
        for (let section of sections) {
            if (this.metaNavMap[section.id]) {
                this.access[section.id] = await this.checkItems(this.metaNavMap[section.id]);
                await this.resolveNavItems(section.children);
            }
        }
    }

    async resolveNavItems (items) {
        for (let item of items) {
            if (this.metaNavMap[item.id]) {
                this.access[item.id] = await this.checkItems(this.metaNavMap[item.id]);
            }
        }
    }

    async checkItems (items) {
        if (items instanceof Array) {
            for (let item of items) {
                if (!item.rule || await this.checkRule(item.rule)) {
                    return true;
                }
            }
        }
    }
};

const ArrayHelper = require('areto/helper/ArrayHelper');