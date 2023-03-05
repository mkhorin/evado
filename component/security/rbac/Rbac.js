/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const Base = require('areto/security/rbac/Rbac');

module.exports = class Rbac extends Base {

    static getConstants () {
        return {
            ANY: '',
            ALL: 'all',
            ALLOW: 'allow',
            DENY: 'deny',

            READ: 'read',
            CREATE: 'create',
            UPDATE: 'update',
            DELETE: 'delete',
            HISTORY: 'history',
            ALL_ACTIONS: [
                'read',
                'create',
                'update',
                'delete',
                'history'
            ],

            TARGET_CLASS: 'class',
            TARGET_VIEW: 'view',
            TARGET_STATE: 'state',
            TARGET_OBJECT: 'object',
            TARGET_TRANSITION: 'transition',
            TARGET_ATTR: 'attr',
            TARGET_SECTION: 'section',
            TARGET_NODE: 'node',

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
                    delete: 'Delete',
                    history: 'View history'
                },
                'targets': {
                    all: 'All',
                    class: 'Class',
                    view: 'View',
                    state: 'State',
                    transition: 'Transition',
                    attr: 'Attribute',
                    object: 'Object',
                    section: 'Navigation section',
                    node: 'Navigation node'
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
            || type === this.TARGET_SECTION
            || type === this.TARGET_NODE;
    }

    static concatFirstArrayItems (target, data, ...keys) {
        for (const key of keys) {
            if (Array.isArray(data[key])) {
                return data[target] = data[target].concat(data[key]);
            }
        }
    }

    static indexMetaItemsByTargetType (items) {
        const data = IndexHelper.indexObjectArrays(items, 'targetType');
        for (const type of Object.keys(data)) {
            if (type !== this.ALL) {
                data[type] = IndexHelper.indexObjectArrays(data[type], 'key');
            }
        }
        return data;
    }

    static indexMetaObjectFilterItems (items) {
        const data = {};
        const allKey = '';
        for (const item of items) {
            if (item.view) {
                ObjectHelper.push(item, `${item.view}.${item.class}`, data);
            } else if (item.class) {
                ObjectHelper.push(item, item.class, data);
            } else {
                ObjectHelper.push(item, allKey, data);
            }
        }
        for (const item of items) {
            if (!item.view && item.class) {
                this.concatFirstArrayItems(item.class, data, allKey);
            }
        }
        for (const item of items) {
            if (item.view && item.class) {
                this.concatFirstArrayItems(`${item.view}.${item.class}`, data, item.class);
            }
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

    static expandMetaItemsWithAny (data) {
        const any = data[this.ANY];
        if (any) {
            for (const key of Object.keys(data)) {
                if (key !== this.ANY) {
                    data[key].push(...any);
                }
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

    init () {
        this.metaHub = this.module.getMetaHub();
        this.metaHub.onAfterLoad(this.load.bind(this));
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
        this.constructor.expandAllAction(this.metaItems);
        this.setMetaMap();
        this.setMetaReadAllowedMap();
        this.setMetaAttrMap();
        this.setMetaObjectFilterMap();
        this.setMetaTransitionMap();
        this.setMetaNavMap();
        this.setAssignmentRules(data.assignmentRules);
        this.setItemTitleMap();
        this.setItemUserMap();
    }

    addDescendantClassMetaItems () {
        if (this.baseMeta) {
            for (const item of this.metaItems) {
                const items = this.getMetaItemDescendants(item);
                this.metaItems.push(...items);
            }
        }
    }

    getMetaItemDescendants (item) {
        const descendants = [];
        const index = item.key.lastIndexOf('.');
        const prefix = index < 0 ? '' : item.key.substring(0, index + 1);
        const cls = this.baseMeta.getClass(item.class);
        if (!cls) {
            return descendants;
        }
        const classDescendants = cls.getDescendants();
        for (const {name} of classDescendants) {
            const child = Object.assign({}, item);
            child.class = name;
            child.key = prefix + name;
            descendants.push(child);
        }
        return descendants;
    }

    addParentRoles (items) {
        for (const item of items) {
            if (item.type === this.ALLOW) {
                if (Array.isArray(item.roles)) {
                    item.roles = this.getParentRoles(item.roles);
                }
            }
        }
    }

    getParentRoles (roles) {
        for (const name of roles) {
            const item = this.itemMap[name];
            if (item instanceof this.Item && item.isRole() && Array.isArray(item.parents)) {
                const parents = item.parents
                    .filter(item => item.isRole())
                    .map(item => item.name);
                roles = roles.concat(parents);
            }
        }
        return ArrayHelper.unique(roles);
    }

    resolveMetaItemRules () {
        for (const item of Object.values(this.metaItems)) {
            if (Array.isArray(item.rules)) {
                this.resolveMetaItemRulesByItem(item);
            }
        }
    }

    resolveMetaItemRulesByItem (item) {
        const rules = [];
        for (const id of item.rules) {
            const rule = this.ruleMap[id];
            if (rule) {
                const data = this.constructor.getItemRuleData(item, rule);
                rules.push(data);
            } else {
                this.log('error', `Rule not found: ${id}`);
            }
        }
        item.rules = rules.length ? rules : null;
    }

    setMetaMap () {
        const items = this.metaItems.filter(this.filterMetaItem, this);
        const data = this.indexMetaItemsByRole(items);
        for (const role of Object.keys(data)) {
            data[role] = IndexHelper.indexObjectArrays(data[role], 'type');
            for (const type of Object.keys(data[role])) {
                const items = IndexHelper.indexObjectArrays(data[role][type], 'actions');
                for (const action of Object.keys(items)) {
                    items[action] = this.constructor.indexMetaItemsByTargetType(items[action]);
                    for (const data of Object.values(items[action])) {
                        this.constructor.expandMetaItemsWithAny(data);
                    }
                }
                data[role][type] = items;
            }
        }
        this.metaMap = data;
    }

    filterMetaItem ({targetType}) {
        return targetType !== this.TARGET_TRANSITION
            && targetType !== this.TARGET_ATTR;
    }

    setMetaReadAllowedMap () {
        const result = {};
        const items = this.metaItems.filter(this.filterMetaReadAllowedItem, this);
        for (const item of items) {
            for (const role of item.roles) {
                const key = item.view
                    ? `${item.view}.${item.class}`
                    : item.class;
                result[role] = result[role] || {};
                result[role][key] = true;
            }
        }
        this.metaReadAllowedMap = items.length ? result : null;
    }

    filterMetaReadAllowedItem ({type, actions, targetType}) {
        return type === this.ALLOW
            && (targetType === this.TARGET_STATE || targetType === this.TARGET_OBJECT)
            && actions.includes(this.READ);
    }

    setMetaAttrMap () {
        let items = this.metaItems.filter(this.filterMetaAttrItem, this);
        let data = this.indexMetaItemsByRoleAction(items);
        this.metaAttrMap = null;
        this.targetMetaAttrMap = null;
        this.objectTargetMetaAttrMap = null;
        if (Object.values(data).length) {
            this.metaAttrMap = data;
            this.targetMetaAttrMap = this.MetaAttrInspector.concatHierarchyItems(items);
            items = items.filter(item => item.state || item.object);
            data = this.indexMetaItemsByRoleAction(items);
            this.objectTargetMetaAttrMap = Object.values(data).length ? data : null;
        }
    }

    filterMetaAttrItem ({type, targetType}) {
        return type === this.DENY && targetType === this.TARGET_ATTR;
    }

    setMetaObjectFilterMap () {
        const items = this.metaItems.filter(this.filterMetaObjectFilterItem, this);
        const data = this.indexMetaItemsByRole(items);
        for (const role of Object.keys(data)) {
            data[role] = this.constructor.indexMetaObjectFilterItems(data[role]);
            this.setRoleMetaObjectFilterMap(data[role]);
        }
        ObjectHelper.deleteEmptyObjectProperties(data);
        this.metaObjectFilterMap = Object.values(data).length ? data : null;
    }

    filterMetaObjectFilterItem ({actions, targetType}) {
        return (targetType === this.ALL
            || targetType === this.TARGET_CLASS
            || targetType === this.TARGET_VIEW
            || targetType === this.TARGET_STATE
            || targetType === this.TARGET_OBJECT)
            && actions.includes(this.READ);
    }

    setRoleMetaObjectFilterMap (data) {
        for (const key of Object.keys(data)) {
            const items = data[key];
            data[key] = new MetaObjectFilter({rbac: this, items});
            data[key].prepare();
        }
    }

    setMetaTransitionMap () {
        const items = this.metaItems.filter(this.filterMetaTransitionItem, this);
        const data = IndexHelper.indexObjectArrays(items, ['roles', 'type', 'key']);
        this.MetaTransitionInspector.concatHierarchyData(data);
        this.metaTransitionMap = Object.values(data).length ? data : null;
    }

    filterMetaTransitionItem ({actions, targetType}) {
        return (targetType === this.ALL || targetType === this.TARGET_TRANSITION)
            && actions.includes(this.UPDATE);
    }

    setMetaNavMap () {
        const targets = [this.TARGET_SECTION, this.TARGET_NODE];
        const items = this.metaItems.filter(this.filterMetaNavItem.bind(this, targets));
        const data = IndexHelper.indexObjectArrays(items, ['roles', 'key']);
        this.metaNavMap = Object.values(data).length ? data : null;
    }

    filterMetaNavItem (targets, item) {
        return item.type === this.DENY
            && item.actions[0] === this.READ
            && targets.includes(item.targetType);
    }

    setItemUserMap () {
        this.itemUserMap = {};
        for (let user of Object.keys(this.assignmentMap)) {
            user = MongoHelper.createId(user);
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
        const module = this.module;
        for (const {_id, name, config} of items) {
            try {
                data[_id] = ClassHelper.resolveSpawn(config, module, {module, name});
            } catch (err) {
                this.log('error', `Invalid assignment rule: ${name}`, err);
            }
        }
        return data;
    }

    indexMetaItemsByRoleAction (items) {
        const data = this.indexMetaItemsByRole(items);
        for (const role of Object.keys(data)) {
            data[role] = IndexHelper.indexObjectArrays(data[role], 'actions');
        }
        return data;
    }

    indexMetaItemsByRole (items) {
        const data = IndexHelper.indexObjectArrays(items, 'roles');
        for (const role of Object.keys(data)) {
            if (!Object.prototype.hasOwnProperty.call(this.itemMap, role)) {
                delete data[role];
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
            if (!items.includes(name)) {
                if (await this.itemMap[name].resolveAssignmentRules(userId)) {
                    items.push(name);
                }
            }
        }
        return items;
    }

    resolveAccess () {
        return this.executeInspector(this.MetaInspector, ...arguments);
    }

    resolveAttrAccess () {
        return this.executeInspector(this.MetaAttrInspector, ...arguments);
    }

    resolveTransitionAccess () {
        return this.executeInspector(this.MetaTransitionInspector, ...arguments);
    }

    resolveNavAccess () {
        return this.executeInspector(this.MetaNavInspector, ...arguments);
    }

    executeInspector (Inspector, assignments, data, params) {
        const inspector = new Inspector({rbac: this, assignments, params, ...data});
        return inspector.execute();
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
const IndexHelper = require('areto/helper/IndexHelper');
const ObjectHelper = require('areto/helper/ObjectHelper');
const MetaObjectFilter = require('./MetaObjectFilter');
const MongoHelper = require('areto/helper/MongoHelper');