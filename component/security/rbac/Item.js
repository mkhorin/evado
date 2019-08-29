/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const Base = require('areto/security/rbac/Item');

module.exports = class Item extends Base {

    getDocMeta () {
        return this.store.rbac.docMeta;
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
                config.item = this;
                config.userId = userId;
                if (await (new config.Class(config)).execute()) {
                    return true; // can assign item to user
                }
            }
        }
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
        if (ids.length !== data.length) {
            throw new Error(`Assignment rule not found for item: ${this.name}`);
        }
    }

    async createMeta () {        
        await this.validateMetaData();
        const [roles, rule] = await this.prepareMetaData();
        const items = await this.store.findMetaItem().and(this.getMetaCondition()).all();
        for (const item of items) {
            if (this.compareMeta(item)) {
                return this.store.log('warn', this.getMetaDataError('Meta item already exists'));
            }
        }
        if (this.data.rule && !rule) {
            throw new Error(this.getMetaDataError('Rule not found for meta item'));
        }
        const doc = {...this.data};
        doc.roles = roles;
        doc.rule = rule ? rule[this.store.key] : null;
        return this.store.findMetaItem().insert(doc);
    }

    getMetaCondition () {
        const condition = {...this.data};
        for (const key of Object.keys(condition)) {
            condition[key] = condition[key] || '';
        }
        ObjectHelper.deleteProperties(['rule', 'actions', 'roles'], condition);
        return condition;
    }

    async prepareMetaData () {
        this.data.actions = Array.isArray(this.data.actions) ? this.data.actions : [];
        this.data.roles = Array.isArray(this.data.roles) ? this.data.roles : [];
        this.data.rule = this.data.rule || null;
        let roles = [], rule = null;
        if (this.data.rule) {
            rule = await this.store.findRuleByName(this.data.rule).one();
            if (!rule) {
                throw new Error(this.getMetaDataError('Meta item rule not found'));
            }
        }
        for (const name of this.data.roles) {
            const role = await this.store.findRoleItem().and({name}).one();
            if (!role) {
                throw new Error(this.getMetaDataError(`Role not found: ${name}`));
            }
            roles.push(role[this.store.key]);
        }
        return [roles, rule];
    }

    // VALIDATION

    validateMetaData () {
        const rbac = this.store.rbac;
        if (!rbac.constructor.isMetaItemType(this.data.type)) {
            throw new Error(this.getMetaDataError('Invalid meta item type'));
        }
        if (!rbac.constructor.isMetaItemTargetType(this.data.targetType)) {
            throw new Error(this.getMetaDataError('Invalid meta item target type'));
        }
        this.validation = {};
        this.validationError = null;
        switch (this.data.targetType) {
            case rbac.TARGET_CLASS: this.validateMetaClass(); break;
            case rbac.TARGET_VIEW: this.validateMetaView(); break;
            case rbac.TARGET_STATE: this.validateMetaState(); break;
            case rbac.TARGET_OBJECT: this.validateMetaObject(); break;
            case rbac.TARGET_TRANSITION: this.validateMetaTransition(); break;
            case rbac.TARGET_ATTR: this.validateMetaAttr(); break;
            case rbac.TARGET_NAV_SECTION: this.validateMetaNavSection(); break;
            case rbac.TARGET_NAV_NODE: this.validateMetaNavNode(); break;
        }
        if (this.validationError) {
            throw new Error(this.getMetaDataError(this.validationError));
        }
    }

    validateMetaClass () {
        this.validation.class = this.getDocMeta().getClass(this.data.class);
        if (this.validation.class) {
            return true;
        }
        this.validationError = 'Invalid meta item class';
    }

    validateMetaView () {
        if (this.validateMetaClass()) {
            this.validation.view = this.validation.class.getView(this.data.view);
            if (this.validation.view) {
                return true;
            }
            this.validationError = 'Invalid meta item view';
        }
    }

    validateMetaState () {
        if (this.validateMetaClass() && !this.validation.class.getState(this.data.state)) {
            this.validationError = 'Invalid meta item state';
        }
    }

    validateMetaObject () {
    }

    validateMetaTransition () {
        if (this.validateMetaClass() && !this.validation.class.getTransition(this.data.transition)) {
            this.validationError = 'Invalid meta item transition';
        }
    }

    validateMetaAttr () {
        if (this.data.view ? this.validateMetaView() : this.validateMetaClass()) {
            if (!(this.validation.view || this.validation.class).getAttr(this.data.attr)) {
                this.validationError = 'Invalid meta item attr';
            }
        }
    }

    validateMetaNavSection () {
        this.validation.navSection = this.getNavMeta().getSection(this.data.navSection);
        if (this.validation.navSection) {
            return true;
        }
        this.validationError = 'Invalid meta item navigation section';
    }

    validateMetaNavNode () {
        if (this.validateMetaNavSection() && !this.validation.navSection.getNode(this.data.navNode)) {
            this.validationError = 'Invalid meta item navigation node';
        }
    }

    getMetaDataError (message) {
        return `RBAC: ${message}: ${JSON.stringify(this.data)}`;
    }

    compareMeta (item) {
        return ArrayHelper.diff(item.actions, this.data.actions).length;
    }
};

const ArrayHelper = require('areto/helper/ArrayHelper');
const ObjectHelper = require('areto/helper/ObjectHelper');