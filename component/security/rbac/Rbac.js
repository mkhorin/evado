/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const Base = require('areto/security/rbac/Rbac');

module.exports = class Rbac extends Base {

    static getConstants () {
        return {
            ALL: 'all',
            ALLOW: 'allow',
            DENY: 'deny',

            READ: 'read',
            CREATE: 'create',
            UPDATE: 'update',
            DELETE: 'delete',
            ALL_ACTIONS: ['read', 'create', 'update', 'delete'],

            TARGET_CLASS: 'class',
            TARGET_VIEW: 'view',
            TARGET_STATE: 'state',
            TARGET_OBJECT: 'object',
            TARGET_TRANSITION: 'transition',
            TARGET_ATTR: 'attr',
            TARGET_NAV_SECTION: 'navSection',
            TARGET_NAV_NODE: 'navNode',

            VALUE_LABELS: {
                'types': {
                    allow: 'Allow',
                    deny: 'Deny'
                },
                'actions': {
                    all: 'All',
                    read: 'Read',
                    create: 'Create',
                    update: 'Update',
                    delete: 'Delete'
                },
                'targets': {
                    all: 'All',
                    class: 'Class',
                    view: 'View',
                    state: 'State',
                    object: 'Object',
                    transition: 'Transition',
                    attr: 'Attribute',
                    navSection: 'Navigation section',
                    navNode: 'Navigation node'
                }
            }
        };
    }

    static isMetaItemType (type) {
        return type === this.ALLOW || type === this.DENY;
    }

    static isMetaItemAction (action) {
        return action === this.ALL || this.ALL_ACTIONS.includes(action);
    }

    static isMetaTargetType (type) {
        return type === this.ALL
            || type === this.TARGET_CLASS
            || type === this.TARGET_VIEW
            || type === this.TARGET_STATE
            || type === this.TARGET_OBJECT
            || type === this.TARGET_TRANSITION
            || type === this.TARGET_ATTR
            || type === this.TARGET_NAV_SECTION
            || type === this.TARGET_NAV_NODE;
    }

    static splitMetaItemsByType (items) {
        const allow = [], deny = [];
        for (const item of items) {
            item.type === this.ALLOW ? allow.push(item) : deny.push(item);
        }
        return allow.length
            ? (deny.length ? {allow, deny} : {allow})
            : {deny};
    }

    static splitMetaItemMapByType (data) {
        const allow = {}, deny = {};
        for (const key of Object.keys(data)) {
            if (data[key].type === this.ALLOW) {
                allow[key] = data[key];
            } else {
                deny[key] = data[key];
            }
        }
        return Object.values(allow).length
            ? (Object.values(deny).length ? {allow, deny} : {allow})
            : {deny};
    }

    static indexMetaItemsByAction (items) {
        const data = {};
        for (const item of items) {
            const actions = Array.isArray(item.actions) ? item.actions : [];
            for (const action of actions) {
                if (Array.isArray(data[action])) {
                    data[action].push(item);
                } else {
                    data[action] = [item];
                }
            }
        }
        return data;
    }

    static indexMetaItemsByTarget (items) {
        const data = this.indexMetaItems(items, 'targetType');
        for (const target of Object.keys(data)) {
            if (target !== this.ALL) {
                data[target] = this.indexMetaItems(data[target], 'key');
            }
        }
        return data;
    }

    static indexMetaItemsByState (items) {
        const data = {};
        for (const item of items) {
            if (item.view) {
                ObjectHelper.push(item, `${item.view}.${item.class}`, data);
            } else if (item.class) {
                ObjectHelper.push(item, `${item.class}`, data);
            }
        }
        for (const item of items) {
            if (!item.state && !item.view && item.class) {
                this.concatFirstArrayItems(`${item.class}`, data);
            }
        }
        for (const item of items) {
            if (!item.state && item.view) {
                const classKey = `${item.class}`;
                this.concatFirstArrayItems(`${item.view}.${classKey}`, data, classKey);
            }
        }
        return data;
    }

    static concatFirstArrayItems (targetKey, data, ...keys) {
        for (const key of keys) {
            if (Array.isArray(data[key])) {
                return data[targetKey] = data[targetKey].concat(data[key]);
            }
        }
    }

    static indexMetaItems (items, key) {
        const data = {};
        for (const item of items) {
            ObjectHelper.push(item, item[key], data);
        }
        return data;
    }

    static expandAllAction (items) {
        for (const item of items) {
            if (item.actions && item.actions[0] === this.ALL) {
                item.actions = this.ALL_ACTIONS;
            }
        }
    }

    static getItemRuleData (item, rule) {
        const sourceName = rule.name;
        const name = `${sourceName}.${item.key}`;
        return {...rule, name, sourceName, item};
    }

    constructor (config) {
        super({
            depends: ['metaHub'],
            Store: require('./DatabaseStore'),
            Item: require('./Item'),
            MetaInspector: require('./MetaInspector'),
            MetaAttrInspector: require('./MetaAttrInspector'),
            MetaTransitionInspector: require('./MetaTransitionInspector'),
            MetaNavInspector: require('./MetaNavInspector'),
            ...config
        });
    }

    async init () {
        this.metaHub = this.module.getMetaHub();
        this.metaHub.onAfterLoad(this.load.bind(this));
        //await super.init();
    }

    load () {
        this.baseMeta = this.metaHub.get('base');
        this.navMeta = this.metaHub.get('navigation');
        return super.load();
    }

    build (data) {
        super.build(data);
        this.metaItems = data.metaItems;
        this.addParentRoles(this.metaItems);
        this.resolveMetaItemRules();
        this.addDescendantClassMetaItems();
        this.setMetaMap();
        this.setMetaAttrMap();
        this.setMetaObjectFilterMap();
        this.setMetaTransitionMap();
        this.setMetaNavMap();
        this.setAssignmentRules(data.assignmentRules);
        this.setItemTitleMap();
        this.setItemUserMap();
        this.metaObjectFilters.map(filter => filter.prepare());
    }

    addDescendantClassMetaItems () {
        const items = [];
        for (const item of this.metaItems) {
            const index = item.key.lastIndexOf('.');
            const prefix = index < 0 ? '' : item.key.substring(0, index + 1);
            const metaClass = this.baseMeta.getClass(item.class);
            if (metaClass) {
                for (const {name} of metaClass.getDescendants()) {
                    const child = Object.assign({}, item);
                    child.class = name;
                    child.key = prefix + name;
                    items.push(child);
                }
            }
        }
        this.metaItems.push(...items);
    }

    addParentRoles (items) {
        for (const item of items) {
            if (item.type === Rbac.ALLOW && Array.isArray(item.roles)) {
                item.roles = this.getParentRoles(item.roles);
            }
        }
    }

    getParentRoles (roles) {
        for (const name of roles) {
            const item = this.itemMap[name];
            if (item instanceof this.Item && item.isRole() && Array.isArray(item.parents)) {
                const parents = item.parents.filter(item => item.isRole()).map(item => item.name);
                roles = roles.concat(parents);
            }
        }
        return ArrayHelper.unique(roles);
    }

    resolveMetaItemRules () {
        for (const item of Object.values(this.metaItems)) {
            const rule = this.ruleMap[item.rule];
            if (rule && Object.prototype.hasOwnProperty.call(this.ruleMap, item.rule)) {
                item.rule = this.constructor.getItemRuleData(item, rule);
            } else if (item.rule) {
                this.log('error', `Rule not found: ${item.rule}`);
                item.rule = null;
            }
        }
    }

    setMetaMap () {
        const items = this.metaItems.filter(({targetType}) => {
            return targetType !== this.TARGET_TRANSITION && targetType !== this.TARGET_ATTR
        });
        this.constructor.expandAllAction(items);
        const data = this.indexMetaItemsByRole(items);
        for (const role of Object.keys(data)) {
            data[role] = this.constructor.splitMetaItemsByType(data[role]);
            for (const type of Object.keys(data[role])) {
                const items = this.constructor.indexMetaItemsByAction(data[role][type]);
                for (const action of Object.keys(items)) {
                    items[action] = this.constructor.indexMetaItemsByTarget(items[action]);
                }
                data[role][type] = items;
            }
        }
        this.metaMap = data;
    }

    setMetaAttrMap () {
        let items = this.metaItems.filter(item => {
            return item.type === this.DENY && item.targetType === this.TARGET_ATTR;
        });
        this.constructor.expandAllAction(items);
        let data = this.indexMetaItemsByRoleAction(items);
        this.metaAttrMap = this.targetMetaAttrMap = this.objectTargetMetaAttrMap = null;
        if (Object.values(data).length) {
            this.metaAttrMap = data;
            this.targetMetaAttrMap = this.MetaAttrInspector.concatHierarchyItems(items);
            items = items.filter(item => item.state || item.object);
            data = this.indexMetaItemsByRoleAction(items);
            this.objectTargetMetaAttrMap = Object.values(data).length ? data : null;
        }
    }

    setMetaObjectFilterMap () {
        const items = this.metaItems.filter(({targetType, actions, rule}) => {
            return (actions.includes(Rbac.ALL) || actions.includes(Rbac.READ))
                && ((rule && (targetType === this.TARGET_CLASS || targetType === this.TARGET_VIEW))
                    || (targetType === this.TARGET_STATE || targetType === this.TARGET_OBJECT));
        });
        const data = this.indexMetaItemsByRole(items);
        this.metaObjectFilters = [];
        for (const role of Object.keys(data)) {
            data[role] = this.constructor.indexMetaItemsByState(data[role]);
            this.setRoleMetaObjectFilterMap(data[role]);
        }
        this.metaObjectFilterMap = data;
    }

    setRoleMetaObjectFilterMap (data) {
        for (const key of Object.keys(data)) {
            data[key] = new MetaObjectFilter({
                rbac: this,
                items: data[key]
            });
            this.metaObjectFilters.push(data[key]);
        }
    }

    setMetaTransitionMap () {
        const items = this.metaItems.filter(item => {
            return item.type === this.DENY && item.targetType === this.TARGET_TRANSITION;
        });
        const data = this.indexMetaItemsByRoleKey(items);
        if (data){
            this.MetaTransitionInspector.concatHierarchyItems(items, data);
        }
        this.metaTransitionMap = data;
    }

    setMetaNavMap () {
        const targets = [this.TARGET_NAV_SECTION, this.TARGET_NAV_NODE];
        const items = this.metaItems.filter(item => {
            return item.type === this.DENY && item.actions[0] === this.READ && targets.includes(item.targetType);
        });
        this.metaNavMap = this.indexMetaItemsByRoleKey(items);
    }

    setItemUserMap () {
        this.itemUserMap = {};
        for (let user of Object.keys(this.assignmentMap)) {
            user = MongoHelper.createObjectId(user);
            for (const item of this.assignmentMap[user]) {
                ObjectHelper.push(user, item, this.itemUserMap);
            }
        }
    }

    setItemTitleMap () {
        this.itemTitleMap = {};
        for (const name of Object.keys(this.itemMap)) {
            this.itemTitleMap[name] = this.itemMap[name].label || name;
        }
    }

    setAssignmentRules (items) {
        const data = this.createAssignmentRuleMap(items);
        this.assignmentRuleItems = [];
        for (const name of Object.keys(this.itemMap)) {
            const item = this.itemMap[name];
            if (item.setAssignmentRules(data)) {
                this.assignmentRuleItems.push(name);
            }
        }
    }

    createAssignmentRuleMap (items) {
        const data = {};
        for (const {_id, config} of items) {
            try {
                data[_id] = ClassHelper.resolveSpawn(config, this.module);
                config.module = this.module;
            } catch (err) {
                this.log('error', `Invalid assignment rule: ${_id}`, err);
            }
        }
        return data;
    }

    indexMetaItemsByRoleAction (items) {
        const data = this.indexMetaItemsByRole(items);
        for (const role of Object.keys(data)) {
            data[role] = this.constructor.indexMetaItemsByAction(data[role]);
        }
        return data;
    }

    indexMetaItemsByRoleKey (items) {
        const data = this.indexMetaItemsByRole(items);
        for (const role of Object.keys(data)) {
            data[role] = this.constructor.indexMetaItems(data[role], 'key');
        }
        return Object.values(data).length ? data : null;
    }

    indexMetaItemsByRole (items) {
        const data = {};
        if (Array.isArray(items)) {
            for (const item of items) {
                if (Array.isArray(item.roles)) {
                    for (const role of item.roles) {
                        if (Object.prototype.hasOwnProperty.call(this.itemMap, role)) {
                            ObjectHelper.push(item, role, data);
                        }
                    }
                }
            }    
        }        
        return data;
    }

    async getUserAssignments (userId) {
        const items = super.getUserAssignments(userId);
        if (!this.assignmentRuleItems.length) {
            return items;
        }
        const ruleItems = await this.getUserAssignmentsByRules(userId);
        if (!items) {
            return ruleItems;
        }
        return ruleItems.length ? items.concat(ruleItems) : items;

    }

    async getUserAssignmentsByRules (userId) {
        const items = [];
        for (const name of this.assignmentRuleItems) {
            if (!items.includes(name) && await this.itemMap[name].resolveAssignmentRules(userId)) {
                items.push(name);
            }
        }
        return items;
    }

    resolveAccess (assignments, data, params) {
        return (new this.MetaInspector({rbac: this, assignments, params, ...data})).execute();
    }

    resolveAttrAccess (assignments, data, params) {
        return (new this.MetaAttrInspector({rbac: this, assignments, params, ...data})).execute();
    }

    resolveTransitionAccess (assignments, data, params) {
        return (new this.MetaTransitionInspector({rbac: this, assignments, params, ...data})).execute();
    }

    resolveNavAccess (assignments, data) {
        return (new this.MetaNavInspector({rbac: this, assignments, ...data})).execute();
    }

    // DEFAULTS

    async createByData (data) {
        if (data) {
            await this.store.createAssignmentRules(data.assignmentRules);
            await super.createByData(data);
            await this.store.createMetaItems(data.metaPermissions);
        }
    }
};
module.exports.init();

const ArrayHelper = require('areto/helper/ArrayHelper');
const ClassHelper = require('areto/helper/ClassHelper');
const ObjectHelper = require('areto/helper/ObjectHelper');
const MetaObjectFilter = require('./MetaObjectFilter');
const MongoHelper = require('areto/helper/MongoHelper');