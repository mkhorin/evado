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

    static isMetaItemTargetType (type) {
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
        const result = {};
        for (const item of items) {
            const actions = Array.isArray(item.actions) ? item.actions : [];
            for (const action of actions) {
                if (Array.isArray(result[action])) {
                    result[action].push(item);
                } else {
                    result[action] = [item];
                }
            }
        }
        return result;
    }

    static indexMetaItemsByTarget (items) {
        const map = this.indexMetaItems(items, 'targetType');
        for (const target of Object.keys(map)) {
            if (target !== this.ALL) {
                map[target] = this.indexMetaItems(map[target], 'key');
            }
        }
        return map;
    }

    static indexMetaItemsByState (items) {
        const map = {};
        for (const item of items) {
            if (item.view) {
                ObjectHelper.push(item, `${item.view}.${item.class}`, map);
            } else if (item.class) {
                ObjectHelper.push(item, `${item.class}`, map);
            }
        }
        for (const item of items) {
            if (!item.state && !item.view && item.class) {
                this.concatFirstArrayItems(`${item.class}`, map);
            }
        }
        for (const item of items) {
            if (!item.state && item.view) {
                const classKey = `${item.class}`;
                this.concatFirstArrayItems(`${item.view}.${classKey}`, map, classKey);
            }
        }
        return map;
    }

    static concatFirstArrayItems (targetKey, map, ...keys) {
        for (const key of keys) {
            if (Array.isArray(map[key])) {
                return map[targetKey] = map[targetKey].concat(map[key]);
            }
        }
    }

    static indexMetaItems (items, key) {
        const result = {};
        for (const item of items) {
            ObjectHelper.push(item, item[key], result);
        }
        return result;
    }

    static expandAllAction (items) {
        for (const item of items) {
            if (item.actions && item.actions[0] === this.ALL) {
                item.actions = this.ALL_ACTIONS;
            }
        }
    }

    static getItemRuleData (item, rule) {
        const name = `${rule.name}.${item.key}`;
        return {...rule, name, item};
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
        this.meta = this.module.getMetaHub();
        this.meta.onAfterLoad(this.prepareMetaDependencies.bind(this));
        await super.init();
    }

    build (data) {
        super.build(data);
        this.metaItems = data.metaItems;
        this.addParentRoles(this.metaItems);
        this.resolveMetaItemRules();
        this.setMetaMap();
        this.setMetaAttrMap();
        this.setMetaObjectFilterMap();
        this.setMetaTransitionMap();
        this.setMetaNavMap();
        this.setAssignmentRules(data.assignmentRules);
        this.prepareMetaDependencies();
    }

    prepareMetaDependencies () {
        this.docMeta = this.meta.get('document');
        this.navMeta = this.meta.get('navigation');
        this.metaObjectFilters.map(filter => filter.prepare());
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
                roles = roles.concat(item.parents
                    .filter(item => item.isRole())
                    .map(item => item.name)
                );
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
        const items = this.metaItems.filter(item => {
            return item.targetType !== this.TARGET_TRANSITION && item.targetType !== this.TARGET_ATTR
        });
        this.constructor.expandAllAction(items);
        const map = this.indexMetaItemsByRole(items);
        for (const role of Object.keys(map)) {
            map[role] = this.constructor.splitMetaItemsByType(map[role]);
            for (const type of Object.keys(map[role])) {
                const items = this.constructor.indexMetaItemsByAction(map[role][type]);
                for (const action of Object.keys(items)) {
                    items[action] = this.constructor.indexMetaItemsByTarget(items[action]);
                }
                map[role][type] = items;
            }
        }
        this.metaMap = map;
    }

    setMetaAttrMap () {
        const items = this.metaItems.filter(item => item.type === this.DENY && item.targetType === this.TARGET_ATTR);
        this.constructor.expandAllAction(items);
        let map = this.indexMetaItemsByRoleAction(items);
        this.metaAttrMap = this.targetMetaAttrMap = this.objectTargetMetaAttrMap = null;
        if (Object.values(map).length) {
            this.metaAttrMap = map;
            this.targetMetaAttrMap = this.MetaAttrInspector.concatHierarchyItems(items);
            map = this.indexMetaItemsByRoleAction(items.filter(item => item.state || item.object));
            this.objectTargetMetaAttrMap = Object.values(map).length ? map : null;
        }
    }

    setMetaObjectFilterMap () {
        const items = this.metaItems.filter(item => {
            return item.type === this.DENY
                && (item.targetType === this.TARGET_STATE || item.targetType === this.TARGET_OBJECT)
                && (item.actions.includes(Rbac.ALL) || item.actions.includes(Rbac.READ));
        });
        const map = this.indexMetaItemsByRole(items);
        this.metaObjectFilters = [];
        for (const role of Object.keys(map)) {
            map[role] = this.constructor.indexMetaItemsByState(map[role]);
            for (const key of Object.keys(map[role])) {
                map[role][key] = new MetaObjectFilter({
                    rbac: this,
                    items: map[role][key]
                });
                this.metaObjectFilters.push(map[role][key]);
            }
        }
        this.metaObjectFilterMap = map;
    }

    setMetaTransitionMap () {
        const items = this.metaItems.filter(item => {
            return item.type === this.DENY && item.targetType === this.TARGET_TRANSITION;
        });
        const map = this.indexMetaItemsByRoleKey(items);
        if (map){
            this.MetaTransitionInspector.concatHierarchyItems(items, map);
        }
        this.metaTransitionMap = map;
    }

    setMetaNavMap () {
        const targets = [this.TARGET_NAV_SECTION, this.TARGET_NAV_NODE];
        const items = this.metaItems.filter(item => {
            return item.type === this.DENY && item.actions[0] === this.READ && targets.includes(item.targetType);
        });
        this.metaNavMap = this.indexMetaItemsByRoleKey(items);
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
        const result = {};
        for (const item of items) {
            try {
                result[item._id] = ClassHelper.resolveSpawn(item.config, this.module);
                item.config.module = this.module;
            } catch (err) {
                this.log('error', `Invalid assignment rule: ${item._id}`, err);
            }
        }
        return result;
    }

    indexMetaItemsByRoleAction (items) {
        const map = this.indexMetaItemsByRole(items);
        for (const role of Object.keys(map)) {
            map[role] = this.constructor.indexMetaItemsByAction(map[role]);
        }
        return map;
    }

    indexMetaItemsByRoleKey (items) {
        const map = this.indexMetaItemsByRole(items);
        for (const role of Object.keys(map)) {
            map[role] = this.constructor.indexMetaItems(map[role], 'key');
        }
        return Object.values(map).length ? map : null;
    }

    indexMetaItemsByRole (items) {
        const map = {};
        for (const item of (items || [])) {
            if (Array.isArray(item.roles)) {
                for (const role of item.roles) {
                    if (Object.prototype.hasOwnProperty.call(this.itemMap, role)) {
                        ObjectHelper.push(item, role, map);
                    }
                }
            }
        }
        return map;
    }

    async getUserAssignments (userId) {
        let roles = super.getUserAssignments(userId);
        if (this.assignmentRuleItems.length) {
            roles = roles || [];
            for (const name of this.assignmentRuleItems) {
                if (!roles.includes(name) && await this.itemMap[name].resolveAssignmentRules(userId)) {
                    roles.push(name);
                }
            }
        }
        return roles;
    }

    getAccess (assignments, data, params) {
        return (new this.MetaInspector({rbac: this, assignments, params, ...data})).execute();
    }

    getAttrAccess (assignments, data, params) {
        return (new this.MetaAttrInspector({rbac: this, assignments, params, ...data})).execute();
    }

    getTransitionAccess (assignments, data, params) {
        return (new this.MetaTransitionInspector({rbac: this, assignments, params, ...data})).execute();
    }

    getNavAccess (assignments, data) {
        return (new this.MetaNavInspector({rbac: this, assignments, ...data})).execute();
    }

    // DEFAULTS

    async createByData (data) {
        if (data) {
            await this.store.createAssignmentRules(data.assignmentRules);
            await super.createByData(data);
            await this.store.createMetaItems(data.meta);
        }
    }
};
module.exports.init();

const ArrayHelper = require('areto/helper/ArrayHelper');
const ClassHelper = require('areto/helper/ClassHelper');
const ObjectHelper = require('areto/helper/ObjectHelper');
const MetaObjectFilter = require('./MetaObjectFilter');