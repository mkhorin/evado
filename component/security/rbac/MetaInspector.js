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
        const items = [];
        for (const role of this.assignments) {
            if (Object.prototype.hasOwnProperty.call(this.rbac.metaMap, role)) {
                items.push(this.rbac.metaMap[role]);
            }
        }
        this.access = {};
        if (!items.length) {
            return this;
        }
        this._targets = [[this.checkAllTarget]];
        switch (this.targetType) {
            case Rbac.TARGET_NAV_NODE: this.addNavNodeTargets(); break;
            case Rbac.TARGET_VIEW: this.addViewTargets(); break;
            case Rbac.TARGET_CLASS: this.addClassTargets(); break;
            case Rbac.TARGET_OBJECT: this.addObjectTargets(); break;
        }
        for (const item of items) {
            for (const action of this.actions) {
                if (this.access[action] !== true) {
                    this.access[action] = await this.resolveActionAccess(action, item);
                }
            }
        }
        return this;
    }

    addNavNodeTargets () {
        if (this.targetClass) {
            this._targets.push([this.checkClassTarget, this.targetClass]);
        }
        if (this.targetView && this.targetView !== this.targetClass) {
            this._targets.push([this.checkViewTarget, this.targetView]);
        }
        this._targets.push([this.checkNavSectionTarget, this.target.section]);
        for (const parent of this.target.getParents()) {
            this._targets.push([this.checkNavNodeTarget, parent]);
        }
        this._targets.push([this.checkNavNodeTarget, this.target]);
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

    async resolveActionAccess (action, data) {
        if (data.deny && data.deny.hasOwnProperty(action)) {
            if (await this.checkTargets(data.deny[action])) {
                return false;
            }
        }
        if (data.allow && data.allow.hasOwnProperty(action)) {
            return this.checkTargets(data.allow[action]);
        }
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

    checkNavSectionTarget (section, data) {
        data = data[Rbac.TARGET_NAV_SECTION];
        return data && data[section.id] ? this.checkItems(data[section.id]) : false;
    }

    checkNavNodeTarget (item, data) {
        data = data[Rbac.TARGET_NAV_NODE];
        return data && data[item.id] ? this.checkItems(data[item.id]) : false;
    }

    checkClassTarget (metaClass, data) {
        data = data[Rbac.TARGET_CLASS] && data[Rbac.TARGET_CLASS][metaClass.id];
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

    async checkObjectTarget (model, data) {
        data = data[Rbac.TARGET_OBJECT];
        if (!data) {
            return false;
        }
        let key = `...${model.class.id}`;
        if (data[key] && await this.checkItems(data[key])) {
            return true;
        }
        const oid = model.getId().toString();
        key = `${oid}...${model.class.id}`;
        if (data[key] && await this.checkItems(data[key])) {
            return true;
        }
        const state = model.getState();
        if (model.view !== model.class) {
            key = `..${model.view.id}`;
            if (data[key] && await this.checkItems(data[key])) {
                return true;
            }
            key = `${oid}..${model.view.id}`;
            if (data[key] && await this.checkItems(data[key])) {
                return true;
            }
            if (state) {
                key = `.${state.name}.${model.view.id}`;
                if (data[key] && await this.checkItems(data[key])) {
                    return true;
                }
                key = `${oid}.${state.name}.${model.view.id}`;
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
        key = `${oid}.${state.name}..${model.class.id}`;
        if (data[key] && await this.checkItems(data[key])) {
            return true;
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
        if (Object.values(this.rbac.metaObjectFilterMap).length) {
            this._norObjectConditions = ['NOR'];
            this._andObjectConditions = ['AND'];
            this._metaObjectRuleCache = {};
            if (!await this.resolveObjectFilterAssignments()) {
                if (this._norObjectConditions.length > 1) {
                    query.and(this._norObjectConditions);
                }
                if (this._andObjectConditions.length > 1) {
                    query.and(this._andObjectConditions);
                }
            }
            return PromiseHelper.setImmediate();
        }
    }

    async resolveObjectFilterAssignments () {
        for (const role of this.assignments) {
            const data = this.rbac.metaObjectFilterMap[role];
            if (!data) {
                return true; // no filter to role
            }
            const filter = data[this.target.id] || (this.target.isClass() ? null : data[this.target.class.id]);
            if (!filter) {
                return true; // no filter to role
            }
            if (await this.resolveRoleObjectFilter(filter)) {
                return true;
            }
        }
    }

    async resolveRoleObjectFilter ({rules, condition, all}) {
        const ruleConditions = Array.isArray(rules) ? await this.getRuleObjectFilters(rules) : [];
        if (all) {
            ruleConditions.push(['FALSE']);
        }
        if (condition) {
            this._norObjectConditions.push(condition);
        } else if (!ruleConditions.length) {
            return true; // no filter to role
        }
        this._andObjectConditions.push(...ruleConditions);
        return PromiseHelper.setImmediate();
    }

    async getRuleObjectFilters (rules) {
        const conditions = [];
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
        return conditions;
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