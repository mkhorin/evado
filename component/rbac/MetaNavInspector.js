'use strict';

const Base = require('areto/rbac/Inspector');

module.exports = class MetaNavInspector extends Base {

    /**
     * metaNavMap
     * role
     *   allow
     *      all: []
     *      navSection
     *          id: []
     *      navItem
     *          id: []
     */

    static intersectData (d1, d2) {
        let result = {};
        for (let key of ArrayHelper.intersect(Object.keys(d1), Object.keys(d2))) {
            result[key] = d1[key].concat(d2[key]);
        }
        return result;
    }

    async execute () {
        this.metaData = [];
        for (let role of this.assignments) {
            if (Object.prototype.hasOwnProperty.call(this.rbac.metaNavMap, role)) {
                this.metaData.push(this.rbac.metaNavMap[role]);
            }
        }
        this.access = {};
        /*
        if (this.metaMap[this.section.id]) {
            this.access[section.id] = await this.checkItems(this.metaNavMap[section.id]);
            await this.resolveNavItems(section.children);
        }

        for (let data of this.metaData) {
            if (this.access[action] !== true) {
                this.access[action] = await this.resolveActionAccess(action, data);
            }
        }//*/
        return this.access;

        /*
        let map = this.rbac.metaNavMap;
        if (!map) {
            return null;
        }
        this.access = {};
        this.metaData = [];
        for (let role of this.assignments) {
            if (Object.prototype.hasOwnProperty.call(map, role)) {
                this.metaData.push(map[role]);
            }
        }
        await this.resolveNavSection(data.section);
        await this.resolveNavItems(data.items);

        this.metaNavMap = this.filterMetaData(this.rbac.metaNavMap);
        this.access = {};
        if (!this.metaNavMap) {
            return this.access;
        }
        if (Array.isArray(data.sections)) {
            await this.resolveNavSections(data.sections);
        }
        if (Array.isArray(data.items)) {
            await this.resolveNavItems(data.items);
        }
        return this.access;
        */
    }

    async resolveActionAccess (action, data) {
        if (data.deny && data.deny.hasOwnProperty(action)) {
            if (await this.checkAllTargets(data.deny[action])) {
                return false;
            }
        }
        if (data.allow && data.allow.hasOwnProperty(action)) {
            return this.checkAllTargets(data.allow[action]);
        }
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

    async resolveNavSection (section) {
        if (this.metaMap[section.id]) {
            this.access[section.id] = await this.checkItems(this.metaNavMap[section.id]);
            await this.resolveNavItems(section.children);
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