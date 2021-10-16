/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const Base = require('areto/security/rbac/Inspector');

module.exports = class MetaAttrInspector extends Base {

    /**
     * metaAttrMap - only DENY and TARGET_ATTR data
     * reader:
     *    *
     *    read
     *        [] attr data
     *    create
     *    update
     */

    static concatHierarchyItems (items) {
        const data = {};
        for (const item of items) {
            const key = `${item.object}.${item.state}.${item.view}.${item.class}`;
            ObjectHelper.push(item, key, data);
        }
        for (const item of items) {
            if (item.view ? (!item.state && !item.object) : (item.state ? !item.object : item.object)) {
                const key = `${item.object}.${item.state}.${item.view}.${item.class}`;
                const classKey = `...${item.class}`;
                Rbac.concatFirstArrayItems(key, data, classKey);
            }
        }
        for (const item of items) {
            if (item.view && (item.state ? !item.object : item.object)) {
                const key = `${item.object}.${item.state}.${item.view}.${item.class}`;
                const viewKey = `..${item.view}.${item.class}`;
                const classKey = `...${item.class}`;
                Rbac.concatFirstArrayItems(key, data, viewKey, classKey);
            }
        }
        for (const item of items) {
            if (item.state && item.object) {
                const key = `${item.object}.${item.state}.${item.view}.${item.class}`;
                const stateKey = `.${item.state}.${item.view}.${item.class}`;
                const viewKey = `..${item.view}.${item.class}`;
                const classKey = `...${item.class}`;
                Rbac.concatFirstArrayItems(key, data, stateKey, viewKey, classKey);
            }
        }
        return data;
    }

    canRead (name) {
        const data = this.forbiddenAttrMap;
        return !(Array.isArray(data[Rbac.READ]) && data[Rbac.READ].includes(name));
    }

    canWrite (name) {
        const data = this.forbiddenAttrMap;
        return !(Array.isArray(data[Rbac.CREATE]) && data[Rbac.CREATE].includes(name))
            && !(Array.isArray(data[Rbac.UPDATE]) && data[Rbac.UPDATE].includes(name));
    }

    can (action, name) {
        const data = this.forbiddenAttrMap;
        return !Array.isArray(data[action]) || !data[action].includes(name);
    }

    async execute () {
        this.forbiddenAttrMap = {};
        if (this.rbac.targetMetaAttrMap) {
            let items = this.getTargetAttrItems(this.rbac.targetMetaAttrMap);
            if (items) {
                items = this.filterMetaAttrData(this.rbac.metaAttrMap, items);
                this.forbiddenAttrMap = items.length ? await this.resolveAttrs(items) : {};
            }
        }
        return this;
    }

    getTargetAttrItems (map) {
        const target = this.target;
        switch (this.targetType) {
            case Rbac.TARGET_CLASS:
                return map[`...${target.id}`];

            case Rbac.TARGET_VIEW:
                return target === target.class
                    ? map[`...${target.id}`]
                    : map[`..${target.id}`] || map[`...${target.class.id}`];

            case Rbac.TARGET_OBJECT:
                const id = target.getId().toString();
                const classId = target.class.id;
                const state = target.getState();
                if (state) {
                    if (target.view === target.class) {
                        return map[`${id}.${state.name}..${classId}`]
                            || map[`${id}...${classId}`]
                            || map[`.${state.name}..${classId}`]
                            || map[`...${classId}`];
                    }
                    return map[`${id}.${state.name}.${target.view.id}`]
                        || map[`${id}.${state.name}..${classId}`]
                        || map[`${id}..${target.view.id}`]
                        || map[`${id}...${classId}`]                        
                        || map[`.${state.name}.${target.view.id}`]
                        || map[`.${state.name}..${classId}`]
                        || map[`..${target.view.id}`]
                        || map[`...${classId}`];
                }
                if (target.view === target.class) {
                    return map[`${id}...${classId}`] || map[`...${classId}`];
                }
                return map[`${id}..${target.view.id}`]
                    || map[`${id}...${classId}`]
                    || map[`..${target.view.id}`]
                    || map[`...${classId}`];
        }
    }

    filterMetaAttrData (data, items) {
        const result = [];
        for (let role of this.assignments) {
            if (!Object.prototype.hasOwnProperty.call(data, role)) {
                return []; // no attributes filter to role
            }
            role = data[role];
            const resultValue = {};
            for (const action of this.actions) {
                if (Array.isArray(role[action])) {
                    const actionItems = ArrayHelper.intersect(role[action], items);
                    if (actionItems.length) {
                        resultValue[action] = actionItems;
                    }
                }
            }
            if (Object.values(resultValue).length) {
                result.push(resultValue);
            }
        }
        return result;
    }

    async resolveAttrs (items) {
        const forbiddenAttrMap = {};
        for (const item of items) {
            for (const action of this.actions) {
                if (forbiddenAttrMap[action] === null) {
                    continue; // all action attributes is allowed (by other role)
                }
                if (!item.hasOwnProperty(action)) {
                    forbiddenAttrMap[action] = null;
                    continue;
                }
                const attrs = [];
                await this.checkAttrItems(item[action], attrs);
                if (!attrs.length) {
                    forbiddenAttrMap[action] = null;
                } else if (forbiddenAttrMap[action]) {
                    forbiddenAttrMap[action] = ArrayHelper.intersect(forbiddenAttrMap[action], attrs);
                } else {
                    forbiddenAttrMap[action] = attrs;
                }
            }
        }
        return forbiddenAttrMap;
    }

    async checkAttrItems (items, forbiddenAttrs) {
        for (const {attr, rules} of items) {
            if (!rules) {
                forbiddenAttrs.push(attr);
            } else if (await this.checkRules(rules)) {
                forbiddenAttrs.push(attr);
            }
        }
    }

    /**
     * Check state and object target types ONLY
     * View type and above have already been solved with execute
     */
    resolveObjectTarget (model) {
        const id = model.getId().toString();
        const state = model.getState();
        const map = this.rbac.targetMetaAttrMap;
        let data;
        if (state) {
            if (model.view !== model.class) {
                data = map[`${id}.${state.name}.${model.view.id}`]
                    || map[`${id}.${state.name}..${model.class.id}`]
                    || map[`.${state.name}.${model.view.id}`]
                    || map[`.${state.name}..${model.class.id}`];
            } else {
                data = map[`${id}.${state.name}..${model.class.id}`]
                    || map[`.${state.name}..${model.class.id}`];
            }
        }
        if (!data) {
            data =  model.view !== model.class
                ? map[`${id}..${model.view.id}`] || map[`${id}...${model.class.id}`]
                : map[`${id}...${model.class.id}`];
        }
        if (data) {
            let items = [];
            for (const item of data) {
                if (!this.hasForbiddenItem(item)) {
                    items.push(item);
                }
            }
            items = this.filterMetaAttrData(this.rbac.objectTargetMetaAttrMap, items);
            if (items.length) {
                return this.resolveAttrs(items);
            }
        }
    }

    hasForbiddenItem (item) {
        for (const action of item.actions) {
            if (this.actions.includes(action) && this.can(action, item.attr)) {
                return false;
            }
        }
        return true;
    }

    hasAnyObjectTargetData (className) {
        const data = this.rbac.objectTargetMetaAttrMap;
        if (!data) {
            return false;
        }
        for (const role of this.assignments) {
            if (data[role]) {
                for (const action of this.actions) {
                    if (Array.isArray(data[role][action])) {
                        for (const item of data[role][action]) {
                            if (item.class === className) {
                                return true;
                            }
                        }
                    }
                }
            }
        }
        return false;
    }
};

const ArrayHelper = require('areto/helper/ArrayHelper');
const ObjectHelper = require('areto/helper/ObjectHelper');
const Rbac = require('./Rbac');