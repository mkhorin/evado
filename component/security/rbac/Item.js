/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const Base = require('areto/security/rbac/Item');

module.exports = class Item extends Base {

    getBaseMeta () {
        return this.store.rbac.baseMeta;
    }

    getNavMeta () {
        return this.store.rbac.navMeta;
    }

    setAssignmentRules (data) {
        const rules = [];
        if (Array.isArray(this.assignmentRules)) {
            for (const key of this.assignmentRules) {
                if (Object.prototype.hasOwnProperty.call(data, key)) {
                    rules.push(data[key]);
                }
            }
        }
        this.assignmentRules = rules;
        return rules.length > 0;
    }

    async resolveAssignmentRules (userId) {
        if (Array.isArray(this.assignmentRules)) {
            for (const config of this.assignmentRules) {
                if (await (new config.Class(config)).execute(this, userId)) {
                    return true; // can assign item to user
                }
            }
        }
    }

    async getAssignmentUsers () {
        const users = [];
        if (Array.isArray(this.assignmentRules)) {
            for (const config of this.assignmentRules) {
                users.push(...await (new config.Class(config)).getUsers(this));
            }
        }
        return users;
    }

    // CREATE

    async resolveRelations () {
        const result = await super.resolveRelations();
        await this.resolveAssignmentRuleRelation(result);
        return result;
    }

    async resolveAssignmentRuleRelation (result) {
        const data = this.data.assignmentRules;
        if (!Array.isArray(data) || !data.length) {
            return result.assignmentRules = [];
        }
        result.assignmentRules = await this.store.findAssignmentRuleByName(data).column(this.store.key);
        if (result.assignmentRules.length !== data.length) {
            throw new Error(`Assignment rule not found for item: ${this.name}`);
        }
    }

    async createMeta () {
        this.prepareMetaTargets();
        await this.validateMeta();
        this.skipExistingTargets();
        if (!this.data.targets.length) {
            return false;
        }
        const item = await this.store.findMetaItem().insert({
            description: this.data.description,
            type: this.data.type,
            actions: this.data.actions,
            rule: this._meta.rule,
            roles: this._meta.roles
        });
        const targets = [];
        for (const target of this.data.targets) {
            target.item = item;
            targets.push(target);
        }
        return this.store.findMetaTarget().insert(targets);
    }

    prepareMetaTargets () {
        if (!Array.isArray(this.data.targets)) {
            this.data.targets = [this.data.targets];
        }
        const expansions = [];
        for (const item of this.data.targets) {
            for (const key of Object.keys(item)) {
                if (Array.isArray(item[key])) {
                    const values = item[key];
                    item[key] = values.shift();
                    for (const value of values) {
                        expansions.push({...item, [key]: value});
                    }
                }
            }
        }
        this.data.targets.push(...expansions);
    }

    // MATCHES

    skipExistingTargets () {
        const items = this.store.rbac.metaItems;
        for (const item of items) {
            if (this.checkItemMatch(item)) {
                this.data.targets = this.filterTargets(item);
            }
        }
    }

    checkItemMatch (item) {
        return item.type === this.data.type
            && this.isEqualActions(item.actions)
            && this.isEqualRoles(item.roles)
            && this.isEqualRule(item.rule);
    }

    isEqualActions (actions) {
        return (actions.length === 4 && this.data.actions[0] === this.store.rbac.ALL)
            || !ArrayHelper.hasDiff(actions, this.data.actions);
    }

    isEqualRoles (roles) {
        return !ArrayHelper.hasDiff(roles, this.data.roles).length;
    }

    isEqualRule (rule) {
        return rule ? rule.sourceName === this.data.rule : !this.data.rule;
    }

    filterTargets (item) {
        const result = [];
        for (const target of this.data.targets) {
            if (this.isItemTarget(target, item)) {
                this.store.log('warn', this.getMetaError(`Target already exists: ${JSON.stringify(target)}`));
            } else {
                result.push(target);
            }
        }
        return result;
    }

    isItemTarget (target, item) {
        return item.targetType === target.type && item.key === this.store.getItemKey(target);
    }

    // VALIDATION

    async validateMeta () {
        if (!this.store.rbac.constructor.isMetaItemType(this.data.type)) {
            throw new Error(this.getMetaError('Invalid type'));
        }
        this._meta = {};
        await this.validateMetaActions();
        await this.validateMetaRoles();
        await this.validateMetaTargets();
        await this.validateMetaRule();
    }

    validateMetaActions () {
        if (typeof this.data.actions === 'string') {
            this.data.actions = [this.data.actions];
        }
        if (!Array.isArray(this.data.actions)) {
            throw new Error(this.getMetaError('Actions must be array'));
        }
        for (const action of this.data.actions) {
            if (!this.store.rbac.constructor.isMetaItemAction(action)) {
                throw new Error(this.getMetaError(`Invalid meta action: ${action}`));
            }
        }
    }

    async validateMetaRoles () {
        if (typeof this.data.roles === 'string') {
            this.data.roles = [this.data.roles];
        }
        const roles = this.data.roles;
        if (!Array.isArray(roles)) {
            throw new Error(this.getMetaError('Roles must be array'));
        }
        this._meta.roles = [];
        if (!roles.length) {
            return false;
        }
        const roleMap = await this.store.findRoleItem().and({name: roles}).index('name').all();
        for (const name of roles) {
            if (!roleMap.hasOwnProperty(name)) {
                throw new Error(this.getMetaError(`Role not found: ${name}`));
            }
            this._meta.roles.push(roleMap[name][this.store.key]);
        }
    }

    async validateMetaRule () {
        if (!this.data.rule) {
            return this._meta.rule = null;
        }
        this._meta.rule = await this.store.findRuleByName(this.data.rule).scalar(this.store.key);
        if (!this._meta.rule) {
            throw new Error(this.getMetaError('Rule not found'));
        }
    }

    validateMetaTargets () {
        if (!Array.isArray(this.data.targets)) {
            this.data.targets = [this.data.targets];
        }
        if (!this.data.targets.length) {
            throw new Error(this.getMetaError('Targets must be set'));
        }
        for (const target of this.data.targets) {
            this.validateMetaTarget(target);
        }
    }

    validateMetaTarget (data) {
        if (!data) {
            throw new Error(this.getMetaError('Invalid target data'));
        }
        const rbac = this.store.rbac.constructor;
        if (!rbac.isMetaTargetType(data.type)) {
            throw new Error(this.getMetaError(`Invalid target type: ${data.type}`));
        }
        this._target = {};
        this._targetError = null;
        switch (data.type) {
            case rbac.TARGET_CLASS: this.validateMetaClass(data); break;
            case rbac.TARGET_VIEW: this.validateMetaView(data); break;
            case rbac.TARGET_STATE: this.validateMetaState(data); break;
            case rbac.TARGET_OBJECT: this.validateMetaObject(data); break;
            case rbac.TARGET_TRANSITION: this.validateMetaTransition(data); break;
            case rbac.TARGET_ATTR: this.validateMetaAttr(data); break;
            case rbac.TARGET_NAV_SECTION: this.validateMetaNavSection(data); break;
            case rbac.TARGET_NAV_NODE: this.validateMetaNavNode(data); break;
        }
        if (this._targetError) {
            throw new Error(this.getMetaError(this._targetError));
        }
    }

    validateMetaClass (data) {
        this._target.class = this.getBaseMeta().getClass(data.class);
        if (this._target.class) {
            return true;
        }
        this._targetError = `Invalid class: ${data.class}`;
    }

    validateMetaView (data) {
        if (this.validateMetaClass(data)) {
            this._target.view = this._target.class.getView(data.view);
            if (this._target.view) {
                return true;
            }
            this._targetError = `Invalid view: ${data.view}`;
        }
    }

    validateMetaState (data) {
        if (this.validateMetaClass(data) && !this._target.class.getState(data.state)) {
            this._targetError = `Invalid state: ${data.state}`;
        }
    }

    validateMetaObject () {
    }

    validateMetaTransition (data) {
        if (this.validateMetaClass(data) && !this._target.class.getTransition(data.transition)) {
            this._targetError = `Invalid transition: ${data.transition}`;
        }
    }

    validateMetaAttr (data) {
        if (data.view ? this.validateMetaView(data) : this.validateMetaClass(data)) {
            if (!(this._target.view || this._target.class).getAttr(data.attr)) {
                this._targetError = `Invalid attribute: ${data.attr}`;
            }
        }
    }

    validateMetaNavSection (data) {
        this._target.navSection = this.getNavMeta().getSection(data.navSection);
        if (this._target.navSection) {
            return true;
        }
        this._targetError = `Invalid navigation section: ${data.navSection}`;
    }

    validateMetaNavNode (data) {
        if (this.validateMetaNavSection(data) && !this._target.navSection.getNode(data.navNode)) {
            this._targetError = `Invalid navigation node: ${data.navNode}`;
        }
    }

    getMetaError (message) {
        return `RBAC: Meta: ${message}: ${JSON.stringify(this.data)}`;
    }
};

const ArrayHelper = require('areto/helper/ArrayHelper');