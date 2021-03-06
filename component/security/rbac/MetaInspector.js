/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const Base = require('areto/security/rbac/Inspector');

module.exports = class MetaInspector extends Base {

    /**
     * metaMap
     * role
     *   deny
     *      read
     *          all: []
     *          class
     *              id: []
     *          view
     *              id: []
     */

    canRead () {
        return this.can(Rbac.READ);
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
        return data?.[section.id] ? this.checkItems(data[section.id]) : false;
    }

    checkNodeTarget (item, data) {
        data = data[Rbac.TARGET_NODE];
        return data?.[item.id] ? this.checkItems(data[item.id]) : false;
    }

    checkClassTarget (cls, data) {
        data = data[Rbac.TARGET_CLASS] && data[Rbac.TARGET_CLASS][cls.id];
        return data ? this.checkItems(data) : false;
    }

    checkViewTarget (view, data) {
        data = data[Rbac.TARGET_VIEW] && data[Rbac.TARGET_VIEW][view.id];
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
        let key = `${state.name}..${model.class.id}`;
        if (data[key] && await this.checkItems(data[key])) {
            return true;
        }
        if (model.view === model.class) {
            return false;
        }
        key = `${state.name}.${model.view.id}`;
        return data[key] ? this.checkItems(data[key]) : false;
    }

    async checkNewObjectTarget (model, data) {
        data = data[Rbac.TARGET_OBJECT];
        if (!data) {
            return false;
        }
        let key = `...${model.class.id}`;
        if (data[key] && await this.checkItems(data[key])) {
            return true;
        }
        const state = model.getState();
        if (model.view !== model.class) {
            key = `..${model.view.id}`;
            if (data[key] && await this.checkItems(data[key])) {
                return true;
            }
            if (state) {
                key = `.${state.name}.${model.view.id}`;
                if (data[key] && await this.checkItems(data[key])) {
                    return true;
                }
            }
        }
        if (!state) {
            return false;
        }
        key = `.${state.name}..${model.class.id}`;
        if (data[key] && await this.checkItems(data[key])) {
            return true;
        }
    }

    async checkObjectTarget (model, data) {
        data = data[Rbac.TARGET_OBJECT];
        if (!data) {
            return false;
        }
        let key = `...${model.class.id}`;
        if (data[key] && await this.checkItems(data[key])) {
            return true;
        }
        const oid = model.isNew() ? false : model.getId().toString();
        if (oid) {
            key = `${oid}...${model.class.id}`;
            if (data[key] && await this.checkItems(data[key])) {
                return true;
            }
        }
        const state = model.getState();
        if (model.view !== model.class) {
            key = `..${model.view.id}`;
            if (data[key] && await this.checkItems(data[key])) {
                return true;
            }
            if (oid) {
                key = `${oid}..${model.view.id}`;
                if (data[key] && await this.checkItems(data[key])) {
                    return true;
                }
            }
            if (state) {
                key = `.${state.name}.${model.view.id}`;
                if (data[key] && await this.checkItems(data[key])) {
                    return true;
                }
                if (oid) {
                    key = `${oid}.${state.name}.${model.view.id}`;
                    if (data[key] && await this.checkItems(data[key])) {
                        return true;
                    }
                }
            }
        }
        if (!state) {
            return false;
        }
        key = `.${state.name}..${model.class.id}`;
        if (data[key] && await this.checkItems(data[key])) {
            return true;
        }
        if (oid) {
            key = `${oid}.${state.name}..${model.class.id}`;
            if (data[key] && await this.checkItems(data[key])) {
                return true;
            }
        }
    }

    async checkItems (items) {
        if (Array.isArray(items)) {
            for (const item of items) {
                if (!item.rule || await this.checkRule(item.rule)) {
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
            let roleConditions = ['AND'];
            if (filter.condition) {
                roleConditions.push(filter.condition);
            }
            if (filter.denyRules) {
                const items = await this.getRuleObjectFilters(filter.denyRules, 'NOR');
                if (items) {
                    roleConditions.push(items);
                }
            }
            if (filter.allowRules) {
                const items = await this.getRuleObjectFilters(filter.allowRules, 'OR');
                if (items) {
                    roleConditions.push(items.length === 2 ? items[1] : items);
                }
            }
            if (roleConditions.length === 1) {
                return null;
            }
            conditions.push(roleConditions.length === 2 ? roleConditions[1] : roleConditions);
        }
        if (conditions.length === 1) {
            return null;
        }
        query.and(conditions.length === 2 ? conditions[1] : conditions);
        return PromiseHelper.setImmediate();
    }

    async getRuleObjectFilters (rules, operation) {
        const conditions = [operation];
        const cache = this._metaObjectRuleCache;
        for (const config of rules) {
            const condition = Object.prototype.hasOwnProperty.call(cache, config.name)
                ? cache[config.name]
                : await this.getRuleObjectFilter(config);
            if (condition) {
                conditions.push(condition);
            }
            cache[config.name] = condition;
        }
        return conditions.length !== 1 ? conditions : null;
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