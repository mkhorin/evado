/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 *
 * metaMap
 *   role
 *     deny
 *       read
 *         all: []
 *         class
 *           id: []
 *         view
 *           id: []
 */
'use strict';

const Base = require('areto/security/rbac/Inspector');

module.exports = class MetaInspector extends Base {

    canRead () {
        return this.can(Rbac.READ);
    }

    canReadHistory () {
        return this.can(Rbac.HISTORY);
    }

    canCreate () {
        return this.can(Rbac.CREATE);
    }

    canUpdate () {
        return this.can(Rbac.UPDATE);
    }

    canDelete () {
        return this.can(Rbac.DELETE);
    }

    can (action) {
        return this.access[action] === true;
    }

    async execute () {
        this.access = {};
        if (this.actions) {
            for (const role of this.assignments) {
                if (Object.prototype.hasOwnProperty.call(this.rbac.metaMap, role)) {
                    await this.resolveRoleAccess(this.rbac.metaMap[role]);
                }
            }
        }
        this.resolveReadAllowedAccessOnly();
        return this;
    }

    async resolveRoleAccess ({allow, deny}) {
        if (!this._targets) {
            this.ensureTargets();
        }
        for (const action of this.actions) {
            if (this.access[action]) {
                // other role already allowed action
            } else if (deny?.hasOwnProperty(action) && await this.checkTargets(deny[action])) {
                this.access[action] = false;
            } else if (allow?.hasOwnProperty(action)) {
                this.access[action] = await this.checkTargets(allow[action]);
            }
        }
    }

    ensureTargets () {
        this._targets = [[this.checkAllTarget]];
        switch (this.targetType) {
            case Rbac.TARGET_NODE: this.addNodeTargets(); break;
            case Rbac.TARGET_VIEW: this.addViewTargets(); break;
            case Rbac.TARGET_CLASS: this.addClassTargets(); break;
            case Rbac.TARGET_OBJECT: this.addObjectTargets(); break;
        }
    }

    resolveReadAllowedAccessOnly () {
        if (!this.rbac.metaReadAllowedMap || this.access[Rbac.READ] !== undefined) {
            return;
        }
        let classKey, viewKey;
        switch (this.targetType) {
            case Rbac.TARGET_NODE:
                classKey = this.targetClass?.id;
                viewKey = this.targetView?.id;
                break;
            case Rbac.TARGET_VIEW:
                classKey = this.target.class.id;
                viewKey = this.target.id;
                break;
            case Rbac.TARGET_CLASS:
                classKey = this.target.id;
                break;
            default:
                return;
        }
        for (const role of this.assignments) {
            const data = this.rbac.metaReadAllowedMap[role];
            if (data && (data[classKey] === true || data[viewKey] === true)) {
                this.access[Rbac.READ] = true;
                break;
            }
        }
    }

    addNodeTargets () {
        if (this.targetClass) {
            this._targets.push([this.checkClassTarget, this.targetClass]);
        }
        if (this.targetView && this.targetView !== this.targetClass) {
            this._targets.push([this.checkViewTarget, this.targetView]);
        }
        this._targets.push([this.checkSectionTarget, this.target.section]);
        for (const parent of this.target.getParents()) {
            this._targets.push([this.checkNodeTarget, parent]);
        }
        this._targets.push([this.checkNodeTarget, this.target]);
    }

    addViewTargets () {
        this._targets.push([this.checkClassTarget, this.target.class]);
        if (this.target.class !== this.target) {
            this._targets.push([this.checkViewTarget, this.target]);
        }
    }

    addClassTargets () {
        this._targets.push([this.checkClassTarget, this.target]);
    }

    addObjectTargets () {
        this._targets.push([this.checkClassTarget, this.target.class]);
        if (this.target.getState()) {
            this._targets.push([this.checkStateTarget, this.target]);
        }
        if (this.target.class !== this.target.view) {
            this._targets.push([this.checkViewTarget, this.target.view]);
        }
        this._targets.push([this.checkObjectTarget, this.target]);
    }

    async checkTargets (data) {
        for (const [method, item] of this._targets) {
            if (await method.call(this, item, data)) {
                return true;
            }
        }
    }

    checkAllTarget (none, data) {
        return data[Rbac.ALL] ? this.checkItems(data[Rbac.ALL]) : false
    }

    checkSectionTarget (section, data) {
        data = data[Rbac.TARGET_SECTION];
        data = data && (data[section.id] || data[Rbac.ANY]);
        return data ? this.checkItems(data) : false;
    }

    checkNodeTarget (item, data) {
        data = data[Rbac.TARGET_NODE];
        data = data && (data[item.id] || data[Rbac.ANY]);
        return data ? this.checkItems(data) : false;
    }

    checkClassTarget (cls, data) {
        data = data[Rbac.TARGET_CLASS];
        data = data && (data[cls.id] || data[Rbac.ANY]);
        return data ? this.checkItems(data) : false;
    }

    checkViewTarget (view, data) {
        data = data[Rbac.TARGET_VIEW];
        data = data && (data[view.id] || data[Rbac.ANY]);
        return data ? this.checkItems(data) : false;
    }

    async checkStateTarget (model, data) {
        data = data[Rbac.TARGET_STATE];
        if (!data) {
            return false;
        }
        const state = model.getState();
        if (!state) {
            return false;
        }
        let items = data[`${state.name}..${model.class.id}`] || data[`..${model.class.id}`];
        if (items && await this.checkItems(items)) {
            return true;
        }
        items = data[`..${model.class.id}`];
        if (items && await this.checkItems(items)) {
            return true;
        }
        if (model.view === model.class) {
            return false;
        }
        items = data[`${state.name}.${model.view.id}`] || data[`.${model.view.id}`];
        return items ? this.checkItems(items) : false;
    }

    async checkNewObjectTarget (model, data) {
        data = data[Rbac.TARGET_OBJECT];
        if (!data) {
            return false;
        }
        let items = data[`...${model.class.id}`];
        if (items && await this.checkItems(items)) {
            return true;
        }
        const state = model.getState();
        if (model.view !== model.class) {
            items = data[`..${model.view.id}`];
            if (items && await this.checkItems(items)) {
                return true;
            }
            if (state) {
                items = data[`.${state.name}.${model.view.id}`];
                if (items && await this.checkItems(items)) {
                    return true;
                }
            }
        }
        if (!state) {
            return false;
        }
        items = data[`.${state.name}..${model.class.id}`];
        if (items && await this.checkItems(items)) {
            return true;
        }
    }

    async checkObjectTarget (model, data) {
        data = data[Rbac.TARGET_OBJECT];
        if (!data) {
            return false;
        }
        let items = data[`...${model.class.id}`];
        if (items && await this.checkItems(items)) {
            return true;
        }
        const oid = model.isNew() ? false : model.getId().toString();
        if (oid) {
            items = data[`${oid}...${model.class.id}`];
            if (items && await this.checkItems(items)) {
                return true;
            }
        }
        const state = model.getState();
        if (model.view !== model.class) {
            items = data[`..${model.view.id}`];
            if (items && await this.checkItems(items)) {
                return true;
            }
            if (oid) {
                items = data[`${oid}..${model.view.id}`];
                if (items && await this.checkItems(items)) {
                    return true;
                }
            }
            if (state) {
                items = data[`.${state.name}.${model.view.id}`];
                if (items && await this.checkItems(items)) {
                    return true;
                }
                if (oid) {
                    items = data[`${oid}.${state.name}.${model.view.id}`];
                    if (items && await this.checkItems(items)) {
                        return true;
                    }
                }
            }
        }
        if (!state) {
            return false;
        }
        items = data[`.${state.name}..${model.class.id}`];
        if (items && await this.checkItems(items)) {
            return true;
        }
        if (oid) {
            items = data[`${oid}.${state.name}..${model.class.id}`];
            if (items && await this.checkItems(items)) {
                return true;
            }
        }
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

    // OBJECT FILTER

    async assignObjectFilter (query) {
        if (!this.rbac.metaObjectFilterMap) {
            return null;
        }
        this._metaObjectRuleCache = {};
        const conditions = ['OR'];
        for (const role of this.assignments) {
            if (!this.rbac.metaObjectFilterMap.hasOwnProperty(role)) {
                return null; // no filter to role
            }
            const data = this.rbac.metaObjectFilterMap[role];
            const filter = data[this.target.id] || data[this.target.class.id];
            if (!filter || filter.skipped) {
                return null;
            }
            const roleConditions = await this.getRoleConditions(filter);
            if (!roleConditions) {
                return null;
            }
            conditions.push(roleConditions);
        }
        if (conditions.length === 1) {
            return null;
        }
        query.and(conditions.length === 2 ? conditions[1] : conditions);
        return PromiseHelper.setImmediate();
    }

    async getRoleConditions ({condition, denyRules, allowRules}) {
        const result = ['AND'];
        if (condition) {
            result.push(condition);
        }
        if (denyRules) {
            const conditions = await this.getRuleObjectFilters(denyRules, 'NOR');
            if (conditions) {
                result.push(conditions);
            }
        }
        if (allowRules) {
            const conditions = await this.getRuleObjectFilters(allowRules, 'OR');
            if (conditions) {
                result.push(conditions.length === 2 ? conditions[1] : conditions);
            }
        }
        return result.length === 1 ? null : result.length === 2 ? result[1] : result;
    }

    async getRuleObjectFilters (rules, operation) {
        const result = [operation];
        for (const itemRules of rules) {
            const conditions = await this.getItemRuleObjectFilters(itemRules);
            if (conditions) {
                result.push(conditions);
            }
        }
        return result.length !== 1 ? result : null;
    }

    async getItemRuleObjectFilters (rules) {
        const result = ['AND'];
        for (const config of rules) {
            const condition = Object.prototype.hasOwnProperty.call(this._metaObjectRuleCache, config.name)
                ? this._metaObjectRuleCache[config.name]
                : await this.getRuleObjectFilter(config);
            if (condition) {
                result.push(condition);
            }
            this._metaObjectRuleCache[config.name] = condition;
        }
        return result.length === 2 ? result[1] : result.length === 1 ? null : result;
    }

    getRuleObjectFilter (config) {
        const rule = new config.Class({
            ...config,
            params: config.params ? {...config.params, ...this.params} : this.params,
            inspector: this
        });
        return rule.getObjectFilter();
    }
};

const PromiseHelper = require('areto/helper/PromiseHelper');
const Rbac = require('./Rbac');