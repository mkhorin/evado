'use strict';

const Base = require('areto/rbac/Inspector');

module.exports = class MetaInspector extends Base {

    /**
     * metaData
     * role:
     *   deny
     *      *
     *      read
     *          *: []
     *          project:
     *              (project name): []
     *          class:
     *          view:
     *          state:
     *      create
     *      update
     */

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
        return this.access[action || this.action] === true;
    }

    async execute () {
        this.access = {};
        this.metaData = [];
        for (let role of this.assignments) {
            if (Object.prototype.hasOwnProperty.call(this.rbac.metaMap, role)) {
                this.metaData.push(this.rbac.metaMap[role]);
            }
        }
        for (let data of this.metaData) {
            if (await this.resolveAccess(this.action, data)) {
                this.access[this.action] = true;
                break;
            }
        }
        if (this.actions) {
            await this.resolveExtraAccess()
        }
        return this;
    }

    async resolveAccess (action, data) {
        if (data.deny && data.deny.hasOwnProperty(action)) {
            if (await this.checkAllTargets(data.deny[action])) {
                return false;
            }
        }
        if (data.allow && data.allow.hasOwnProperty(action)) {
            return this.checkAllTargets(data.allow[action]);
        }
    }

    async resolveExtraAccess () {
        for (let data of this.metaData) {
            for (let action of this.actions) {
                if (this.access[action] !== true) {
                    this.access[action] = await this.resolveAccess(action, data);
                }
            }
        }
    }

    async checkAllTargets (targets) {
        this.targets = targets;
        if (!targets[Rbac.ALL]) {
            return this.checkTarget(this.targetType, this.target);
        }
        return await this.checkItems(targets[Rbac.ALL])
            || this.checkTarget(this.targetType, this.target);
    }

    async checkTarget (type, target) {
        if (!this.targets[type]) {
            return this.checkNextTypeTarget(type, target);
        }
        if (type === Rbac.TARGET_STATE) {
           return this.checkStateTarget(target);
        }
        if (type === Rbac.TARGET_OBJECT) {
            return this.checkObjectTarget(target);
        }
        return await this.checkItems(this.targets[type][target.getMetaId()])
            || this.checkNextTypeTarget(type, target);
    }

    checkNextTypeTarget (type, target) {
        switch (type) {
            case Rbac.TARGET_CLASS:
                return this.checkTarget(Rbac.PACK_TARGET, target.project);
                
            case Rbac.TARGET_VIEW:
                return this.checkTarget(Rbac.TARGET_CLASS, target.class);
                
            case Rbac.TARGET_STATE: // target is object
                return target.view.isClass()
                    ? this.checkTarget(Rbac.TARGET_CLASS, target.class)
                    : this.checkTarget(Rbac.TARGET_VIEW, target.view);
                
            case Rbac.TARGET_OBJECT:
                return target.getState() 
                    ? this.checkTarget(Rbac.TARGET_STATE, target)
                    : target.view.isClass()
                        ? this.checkTarget(Rbac.TARGET_CLASS, target.class)
                        : this.checkTarget(Rbac.TARGET_VIEW, target.view);
        }
    }

    checkStateTarget (model) {
        let state = model.getState();
        if (!state) {
            return this.checkNextTypeTarget(Rbac.TARGET_STATE, model);
        }
        let ids = [`${state.name}..${model.class.id}`];
        if (!model.view.isClass()) {
            ids.push(`${state.name}.${model.view.id}`);
        }
        return this.checkSomeTargetIds(ids, Rbac.TARGET_STATE, model);
    }

    checkObjectTarget (model) {
        let objectId = model.getId().toString();
        let state = model.getState();
        let ids = [`...${model.class.id}`, `${objectId}...${model.class.id}`];
        if (!model.view.isClass()) {
            ids.push(`..${model.view.id}`);
            ids.push(`${objectId}..${model.view.id}`);
            if (state) {
                ids.push(`.${state.name}.${model.view.id}`);
                ids.push(`${objectId}.${state.name}.${model.view.id}`);
            }
        }
        if (state) {
            ids.push(`.${state.name}..${model.class.id}`);
            ids.push(`${objectId}.${state.name}..${model.class.id}`);
        }
        return this.checkSomeTargetIds(ids, Rbac.TARGET_OBJECT, model);
    }

    async checkSomeTargetIds (ids, type, target) {
        for (let id of ids) {
            if (this.targets[type][id] && await this.checkItems(this.targets[type][id])) {
                return true;
            }
        }
        return this.checkNextTypeTarget(type, target);
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
            let filter = data[this.target.id]
                || (this.target.isClass() ? null : data[this.target.class.id])
                || data[this.target.class.project.id];
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