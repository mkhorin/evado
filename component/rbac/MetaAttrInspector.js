/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const Base = require('areto/rbac/Inspector');

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
        let map = {}, key, stateKey, viewKey, classKey;
        for (let item of items) {
            key = `${item.object}.${item.state}.${item.view}.${item.class}`;
            ObjectHelper.push(item, key, map);
        }
        for (let item of items) {
            if (item.view ? (!item.state && !item.object) : (item.state ? !item.object : item.object)) {
                key = `${item.object}.${item.state}.${item.view}.${item.class}`;
                classKey = `...${item.class}`;
                Rbac.concatFirstArrayItems(key, map, classKey);
            }
        }
        for (let item of items) {
            if (item.view && (item.state ? !item.object : item.object)) {
                key = `${item.object}.${item.state}.${item.view}.${item.class}`;
                viewKey = `..${item.view}.${item.class}`;
                classKey = `...${item.class}`;
                Rbac.concatFirstArrayItems(key, map, viewKey, classKey);
            }
        }
        for (let item of items) {
            if (item.state && item.object) {
                key = `${item.object}.${item.state}.${item.view}.${item.class}`;
                stateKey = `.${item.state}.${item.view}.${item.class}`;
                viewKey = `..${item.view}.${item.class}`;
                classKey = `...${item.class}`;
                Rbac.concatFirstArrayItems(key, map, stateKey, viewKey, classKey);
            }
        }
        return map;
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
                this.forbiddenAttrMap = await this.resolveAttrs(items);
            }
        }
        return this;
    }

    getTargetAttrItems (map) {
        let target = this.target;
        switch (this.targetType) {
            case Rbac.TARGET_CLASS:
                return map[`...${target.id}`];

            case Rbac.TARGET_VIEW:
                return target === target.class
                    ? map[`...${target.id}`]
                    : map[`..${target.id}`] || map[`...${target.class.id}`];

            case Rbac.TARGET_OBJECT:
                let id = target.getId().toString();
                let classId = target.class.id;
                let state = target.getState();
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
        let result = [], resultValue, actionItems;
        for (let role of this.assignments) {
            if (!Object.prototype.hasOwnProperty.call(data, role)) {
                return null; // no attr filter to role
            }
            role = data[role];
            resultValue = {};
            for (let action of this.actions) {
                if (Array.isArray(role[action])) {
                    actionItems = ArrayHelper.intersect(role[action], items);
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
        let forbiddenAttrMap = {};
        for (let item of items) {
            for (let action of this.actions) {
                if (forbiddenAttrMap[action] === null) {
                    continue; // all action attrs is allowed (by other role)
                }
                if (!item.hasOwnProperty(action)) {
                    forbiddenAttrMap[action] = null;
                    continue;
                }
                let attrs = [];
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
        for (let item of items) {
            if (!item.rule) {
                forbiddenAttrs.push(item.attr);
            } else if (await this.checkRule(item.rule)) {
                forbiddenAttrs.push(item.attr);
            }
        }
    }

    // check state AND object target types ONLY
    // view type and above have already been solved with execute

    resolveObjectTarget (model) {
        let id = model.getId().toString();
        let state = model.getState();
        let map = this.rbac.targetMetaAttrMap, data;
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
            for (let item of data) {
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
        for (let action of item.actions) {
            if (this.actions.includes(action) && this.can(action, item.attr)) {
                return false;
            }
        }
        return true;
    }

    hasAnyObjectTargetData (className) {
        let map = this.rbac.objectTargetMetaAttrMap;
        if (!map) {
            return false;
        }
        for (let role of this.assignments) {
            if (map[role]) {
                for (let action of this.actions) {
                    if (Array.isArray(map[role][action])) {
                        for (let item of map[role][action]) {
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