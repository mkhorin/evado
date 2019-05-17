'use strict';

const Base = require('areto/rbac/Inspector');

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
        this.metaData = [];
        for (let role of this.assignments) {
            if (Object.prototype.hasOwnProperty.call(this.rbac.metaMap, role)) {
                this.metaData.push(this.rbac.metaMap[role]);
            }
        }
        if (!this.metaData.length) {
            return this;
        }
        this._targets = [[this.checkAllTarget]];
        switch (this.targetType) {
            case Rbac.TARGET_NAV_ITEM: this.addNavItemTargets(); break;
            case Rbac.TARGET_VIEW: this.addViewTargets(); break;
            case Rbac.TARGET_CLASS: this.addClassTargets(); break;
            case Rbac.TARGET_OBJECT: this.addObjectTargets(); break;
        }
        this.access = {};
        for (let data of this.metaData) {
            for (let action of this.actions) {
                if (this.access[action] !== true) {
                    this.access[action] = await this.resolveActionAccess(action, data);
                }
            }
        }
        return this;
    }

    addNavItemTargets () {
        if (this.targetClass) {
            this._targets.push([this.checkClassTarget, this.targetClass]);
        }
        if (this.targetView && this.targetView !== this.targetClass) {
            this._targets.push([this.checkViewTarget, this.targetView]);
        }
        this._targets.push([this.checkNavSectionTarget, this.target.section]);
        this._targets.push([this.checkNavItemTarget, this.target]);
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
            this_targets.push([this.checkViewTarget, this.target.view]);
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
        for (let [method, item] of this._targets) {
            if (await method.call(this, item, data)) {
                return true;
            }
        }
    }

    checkAllTarget (target, data) {
        return data[Rbac.ALL] ? this.checkItems(data[Rbac.ALL]) : false
    }

    checkClassTarget (target, data) {
        data = data[Rbac.TARGET_CLASS] && data[Rbac.TARGET_CLASS][target.getMetaId()];
        return data ? this.checkItems(data) : false;
    }

    checkViewTarget (target, data) {
        data = data[Rbac.TARGET_VIEW] && data[Rbac.TARGET_VIEW][target.getMetaId()];
        return data ? this.checkItems(data) : false;
    }

    async checkStateTarget (model, data) {
        data = data[Rbac.TARGET_STATE];
        if (!data) {
            return false;
        }
        let state = model.getState();
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
        data = data[Rbac.TARGET_OBJECT]; // && data[Rbac.TARGET_OBJECT][model.getMetaId()];
        if (!data) {
            return false;
        }
        let key = `...${model.class.id}`;
        if (data[key] && await this.checkItems(data[key])) {
            return true;
        }
        let oid = model.getId().toString();
        key = `${oid}...${model.class.id}`;
        if (data[key] && await this.checkItems(data[key])) {
            return true;
        }
        let state = model.getState();
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
            for (let item of items) {
                if (!item.rule || await this.checkRule(item.rule)) {
                    return true;
                }
            }
        }
    }

    // FILTER OBJECTS

    async filterObjects (query) {
        if (Object.values(this.rbac.metaObjectFilterMap).length) {
            this._objectConditions = [];
            this._metaObjectRuleCache = {};
            if (!await this.filterObjectAssignments()) {
                query.andJoinByOr(this._objectConditions);
            }
            await PromiseHelper.setImmediate();
        }
    }

    async filterObjectAssignments () {
        for (let role of this.assignments) {
            let data = this.rbac.metaObjectFilterMap[role];
            if (!data) {
                return true; // no filter to role
            }
            let filter = data[this.target.id] || (this.target.isClass() ? null : data[this.target.class.id]);
            if (!filter) {
                return true; // no filter to role
            }
            if (await this.filterRoleObjects(filter)) {
                return true;
            }
        }
    }

    async filterRoleObjects (filter) {
        let roleConditions = [];
        if (Array.isArray(filter.rules)) {
            for (let rule of filter.rules) {
                if (Object.prototype.hasOwnProperty.call(this._metaObjectRuleCache, rule.name)) {
                    if (this._metaObjectRuleCache[rule.name]) {
                        roleConditions.push(this._metaObjectRuleCache[rule.name]);
                    }
                } else {
                    let model = new rule.Class(rule);
                    model.params = rule.params
                        ? {...rule.params, ...this.params}
                        : this.params;
                    let data = await model.getObjectCondition();
                    if (data) {
                        roleConditions.push(data);
                    }
                    this._metaObjectRuleCache[rule.name] = data;
                }
            }
        }
        if (filter.condition) {
            roleConditions.push(filter.condition);
        }
        if (!roleConditions.length) {
            return true; // no filter to role
        }
        roleConditions.unshift('NOR');
        this._objectConditions.push(roleConditions);
        await PromiseHelper.setImmediate();
    }
};

const PromiseHelper = require('areto/helper/PromiseHelper');
const Rbac = require('./Rbac');