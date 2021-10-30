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
                try {
                    if (await (new config.Class(config)).execute(this, userId)) {
                        return true; // can assign item to user
                    }
                } catch (err) {
                    this.rbac.log('error', `Item: ${this.name}: ${config.name}`, err);
                }
            }
        }
    }

    async getAssignmentUsers () {
        const users = [];
        if (Array.isArray(this.assignmentRules)) {
            for (const config of this.assignmentRules) {
                try {
                    users.push(...await (new config.Class(config)).getUsers(this));
                } catch (err) {
                    this.rbac.log('error', `Item: ${this.name}: ${config.name}`, err);
                }
            }
        }
        return users;
    }

    // CREATE

    async resolveRelations () {
        const result = await super.resolveRelations();
        result.assignmentRules = await this.resolveAssignmentRuleRelation();
        return result;
    }

    async resolveAssignmentRuleRelation () {
        const names = this.data.assignmentRules;
        if (!Array.isArray(names) || !names.length) {
            return [];
        }
        const result = await this.store.findAssignmentRuleByName(names).column(this.store.key);
        if (result.length !== names.length) {
            throw new Error(`Assignment rule not found for item: ${this.name}`);
        }
        return result;
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
            roles: this._meta.roles,
            rules: this._meta.rules
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
        const result = [];
        for (const data of this.data.targets) {
            result.push(...ObjectHelper.expandArrayValues(data));
        }
        this.data.targets = result;
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
            && this.isEqualRules(item.rules);
    }

    isEqualActions (actions) {
        return actions.length === this.store.rbac.ALL_ACTIONS.length
            && this.data.actions[0] === this.store.rbac.ALL
            || ArrayHelper.hasDiff(actions, this.data.actions) === false;
    }

    isEqualRoles (roles) {
        return !ArrayHelper.hasDiff(roles, this.data.roles);
    }

    isEqualRules (rules) {
        if (!rules) {
            return !this.data.rules;
        }
        if (!this.data.rules) {
            return false;
        }
        return !ArrayHelper.hasDiff(rules, this.data.rules);
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
        this._meta = {};
        await this.validateMetaType();
        await this.validateMetaActions();
        await this.validateMetaTargets();
        this._meta.roles = await this.resolveMetaRoles();
        this._meta.rules = await this.resolveMetaRules();
    }

    validateMetaType () {
        if (!this.store.rbac.constructor.isMetaItemType(this.data.type)) {
            throw new Error(this.getMetaError('Invalid type'));
        }
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
                throw new Error(this.getMetaError(`Invalid action: ${action}`));
            }
        }
    }

    async resolveMetaRoles () {
        let names = this.data.roles;
        if (typeof names === 'string') {
            this.data.roles = names = [names];
        }
        if (!Array.isArray(names)) {
            throw new Error(this.getMetaError('Roles must be array'));
        }
        if (!names.length) {
            return names;
        }
        const roleMap = await this.store.findRoleItem().and({name: names}).index('name').all();
        const result = [];
        for (const name of names) {
            if (!roleMap.hasOwnProperty(name)) {
                throw new Error(this.getMetaError(`Role not found: ${name}`));
            }
            result.push(roleMap[name][this.store.key]);
        }
        return result;
    }

    resolveMetaRules () {
        return this.resolveRuleRelation();
    }

    async getRuleIdByName (name) {
        const id = await super.getRuleIdByName(name);
        if (!id) {
            throw new Error(this.getMetaError(`Rule not found: ${name}`));
        }
        return id;
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
            case rbac.TARGET_CLASS: this.validateMetadataClass(data); break;
            case rbac.TARGET_VIEW: this.validateMetadataView(data); break;
            case rbac.TARGET_STATE: this.validateMetadataState(data); break;
            case rbac.TARGET_OBJECT: this.validateMetadataObject(data); break;
            case rbac.TARGET_TRANSITION: this.validateMetadataTransition(data); break;
            case rbac.TARGET_ATTR: this.validateMetadataAttr(data); break;
            case rbac.TARGET_SECTION: this.validateMetadataSection(data); break;
            case rbac.TARGET_NODE: this.validateMetadataNode(data); break;
        }
        if (this._targetError) {
            throw new Error(this.getMetaError(this._targetError));
        }
    }

    validateMetadataClass (data) {
        if (data.class) {
            this._target.class = this.getBaseMeta().getClass(data.class);
            if (this._target.class) {
                return true;
            }
            this._targetError = `Invalid class: ${data.class}`;
        }
    }

    validateMetadataView (data) {
        if (this.validateMetadataClass(data) && data.view) {
            this._target.view = this._target.class.getView(data.view);
            if (this._target.view) {
                return true;
            }
            this._targetError = `Invalid view: ${data.view}`;
        }
    }

    validateMetadataState (data) {
        if (this.validateMetadataClass(data) && data.state) {
            if (!this._target.class.getState(data.state)) {
                this._targetError = `Invalid state: ${data.state}`;
            }
        }
    }

    validateMetadataObject () {
    }

    validateMetadataTransition (data) {
        if (this.validateMetadataClass(data) && data.transition) {
            if (!this._target.class.getTransition(data.transition)) {
                this._targetError = `Invalid transition: ${data.transition}`;
            }
        }
    }

    validateMetadataAttr (data) {
        if (data.view ? this.validateMetadataView(data) : this.validateMetadataClass(data)) {
            if (!(this._target.view || this._target.class).getAttr(data.attr)) {
                this._targetError = `Invalid attribute: ${data.attr}`;
            }
        }
    }

    validateMetadataSection (data) {
        if (data.section) {
            this._target.section = this.getNavMeta().getSection(data.section);
            if (this._target.section) {
                return true;
            }
            this._targetError = `Invalid navigation section: ${data.section}`;
        }
    }

    validateMetadataNode (data) {
        if (this.validateMetadataSection(data) && data.node) {
            if (!this._target.section.getNode(data.node)) {
                this._targetError = `Invalid navigation node: ${data.node}`;
            }
        }
    }

    getMetaError (message) {
        return `RBAC: Meta: ${message}: ${JSON.stringify(this.data)}`;
    }
};

const ArrayHelper = require('areto/helper/ArrayHelper');
const ObjectHelper = require('areto/helper/ObjectHelper');