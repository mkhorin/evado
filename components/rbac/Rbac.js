'use strict';

const Base = require('areto/rbac/Rbac');

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
            TARGET_PROJECT: 'project',
            TARGET_CLASS: 'class',
            TARGET_VIEW: 'view',
            TARGET_STATE: 'state',
            TARGET_OBJECT: 'object',
            TRANSITION_TARGET: 'transition',
            TARGET_ATTR: 'attr',
            TARGET_NAV_SECTION: 'navSection',
            TARGET_NAV_ITEM: 'navItem',
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
                    project: 'Project',
                    class: 'Class',
                    view: 'View',
                    state: 'State',
                    object: 'Object',
                    transition: 'Transition',
                    attribute: 'Attribute',
                    navSection: 'Nav section',
                    navItem: 'Nav item'
                }
            }
        };
    }

    static isMetaItemType (type) {
        return type === this.ALLOW || type === this.DENY;
    }

    static isMetaItemTargetType (type) {
        return type === this.ALL
            || type === this.TARGET_PROJECT
            || type === this.TARGET_CLASS
            || type === this.TARGET_VIEW
            || type === this.TARGET_STATE
            || type === this.TARGET_OBJECT
            || type === this.TRANSITION_TARGET
            || type === this.TARGET_ATTR
            || type === this.TARGET_NAV_SECTION
            || type === this.TARGET_NAV_ITEM;
    }

    static splitMetaItemsByType (items) {
        let allow = [], deny = [];
        for (let item of items) {
            item.type === this.ALLOW ? allow.push(item) : deny.push(item);
        }
        return allow.length
            ? (deny.length ? {allow, deny} : {allow})
            : {deny};
    }

    static indexMetaItemsByAction (items) {
        let map = {};
        for (let item of items) {
            let actions = item.actions instanceof Array ? item.actions : [];
            for (let action of actions) {
                if (map[action] instanceof Array) {
                    map[action].push(item);
                } else {
                    map[action] = [item];
                }
            }
        }
        return map;
    }

    static indexMetaItemsByTarget (items) {
        let map = this.indexMetaItems(items, 'targetType');
        for (let target of Object.keys(map)) {
            if (target !== this.ALL) {
                map[target] = this.indexMetaItems(map[target], 'key');
            }
        }
        return map;
    }

    static indexMetaItemsByState (items) {
        let map = {};
        for (let item of items) {
            if (item.view) {
                ObjectHelper.push(item, `${item.view}.${item.class}.${item.project}`, map);
            } else if (item.class) {
                ObjectHelper.push(item, `${item.class}.${item.project}`, map);
            } else {
                ObjectHelper.push(item, item.project, map);
            }
        }
        for (let item of items) {
            if (!item.state && !item.view && item.class) {
                this.concatFirstArrayItems(`${item.class}.${item.project}`, map, item.project);
            }
        }
        for (let item of items) {
            if (!item.state && item.view) {
                let classKey = `${item.class}.${item.project}`;
                this.concatFirstArrayItems(`${item.view}.${classKey}`, map, classKey, item.project);
            }
        }
        return map;
    }

    static concatFirstArrayItems (targetKey, map, ...keys) {
        for (let key of keys) {
            if (map[key] instanceof Array) {
                return map[targetKey] = map[targetKey].concat(map[key]);
            }
        }
    }

    static indexMetaItems (items, key) {
        let map = {};
        for (let item of items) {
            ObjectHelper.push(item, item[key], map);
        }
        return map;
    }

    static expandAllAction (items) {
        for (let item of items) {
            if (item.actions && item.actions[0] === this.ALL) {
                item.actions = this.ALL_ACTIONS;
            }
        }
    }

    static getItemRuleData (item, rule) {
        let name = `${rule.name}.${item.key}`;
        return {...rule, name, item};
    }

    constructor (config) {
        super({
            'Item': require('./Item'),
            'store': require('./DbStore'),
            'MetaInspector': require('./MetaInspector'),
            'MetaAttrInspector': require('./MetaAttrInspector'),
            'MetaTransitionInspector': require('./MetaTransitionInspector'),
            'MetaNavInspector': require('./MetaNavInspector'),
            ...config
        });
    }

    async init () {
        this.module.get('meta').onAfterLoad(this.prepareMetaDependencies.bind(this));
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
        this.setUserFilters(data.userFilters);
        this.prepareMetaDependencies();
    }

    prepareMetaDependencies () {
        if (this.module.get('meta')) {
            this.metaObjectFilters.map(filter => filter.prepare());
        }
    }

    addParentRoles (items) {
        for (let item of items) {
            if (item.type === Rbac.ALLOW && item.roles instanceof Array) {
                item.roles = this.getParentRoles(item.roles);
            }
        }
    }

    getParentRoles (roles) {
        for (let name of roles) {
            let item = this.itemMap[name];
            if (item instanceof this.Item && item.isRole() && item.parents instanceof Array) {
                roles = roles.concat(item.parents
                    .filter(item => item.isRole())
                    .map(item => item.name)
                );
            }
        }
        return ArrayHelper.unique(roles);
    }

    resolveMetaItemRules () {
        for (let item of Object.values(this.metaItems)) {
            let rule = this.ruleMap[item.rule];
            if (rule && Object.prototype.hasOwnProperty.call(this.ruleMap, item.rule)) {
                item.rule = this.constructor.getItemRuleData(item, rule);
            } else if (item.rule) {
                this.log('error', `Not found rule: ${item.rule}`);
                item.rule = null;
            }
        }
    }

    setMetaMap () {
        let items = this.metaItems.filter(item => item.targetType !== this.TARGET_ATTR);
        this.constructor.expandAllAction(items);
        let map = this.indexMetaItemsByRole(items);
        for (let role of Object.keys(map)) {
            map[role] = this.constructor.splitMetaItemsByType(map[role]);
            for (let type of Object.keys(map[role])) {
                let items = this.constructor.indexMetaItemsByAction(map[role][type]);
                for (let action of Object.keys(items)) {
                    items[action] = this.constructor.indexMetaItemsByTarget(items[action]);
                }
                map[role][type] = items;
            }
        }
        this.metaMap = map;
    }

    setMetaAttrMap () {
        let items = this.metaItems.filter(item => item.targetType === this.TARGET_ATTR && item.type === this.DENY);
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
        let items = this.metaItems.filter(item => {
            return item.type === this.DENY
                && (item.targetType === this.TARGET_STATE || item.targetType === this.TARGET_OBJECT)
                && (item.actions.includes(Rbac.ALL) || item.actions.includes(Rbac.READ));
        });
        let map = this.indexMetaItemsByRole(items);
        this.metaObjectFilters = [];
        for (let role of Object.keys(map)) {
            map[role] = this.constructor.indexMetaItemsByState(map[role]);
            for (let key of Object.keys(map[role])) {
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
        let items = this.metaItems.filter(item => {
            return item.type === this.DENY && item.targetType === this.TRANSITION_TARGET;
        });
        let map = this.indexMetaItemsByRoleKey(items);
        if (map){
            this.MetaTransitionInspector.concatHierarchyItems(items, map);
        }
        this.metaTransitionMap = map;
    }

    setMetaNavMap () {
        this.metaNavMap = this.metaItems.filter(item => {
            return item.type === this.DENY
                && (item.targetType === this.TARGET_NAV_SECTION || item.targetType === this.TARGET_NAV_ITEM);
        });
        this.metaNavMap = this.indexMetaItemsByRoleKey(this.metaNavMap);
    }

    setUserFilters (items) {
        this.userFilterMap = {};
        for (let item of items) {
            let filter = new UserFilterFactory({
                'rbac': this,
                'data': item
            });
            if (filter.validate()) {
                this.userFilterMap[filter.getId()] = filter;
            }
        }
        this.userFilterItemNames = [];
        for (let name of Object.keys(this.itemMap)) {
            this.itemMap[name].setUserFilters(this.userFilterMap);
            if (this.itemMap[name].userFilters.length) {
                this.userFilterItemNames.push(name);
            }
        }
    }

    indexMetaItemsByRoleAction (items) {
        let map = this.indexMetaItemsByRole(items);
        for (let role of Object.keys(map)) {
            map[role] = this.constructor.indexMetaItemsByAction(map[role]);
        }
        return map;
    }

    indexMetaItemsByRoleKey (items) {
        let map = this.indexMetaItemsByRole(items);
        for (let role of Object.keys(map)) {
            map[role] = this.constructor.indexMetaItems(map[role], 'key');
        }
        return Object.values(map).length ? map : null;
    }

    indexMetaItemsByRole (items) {
        let map = {};
        for (let item of (items || [])) {
            if (item.roles instanceof Array) {
                for (let role of item.roles) {
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
        if (this.userFilterItemNames.length) {
            roles = roles || [];
            let params = {userId};
            for (let name of this.userFilterItemNames) {
                if (!roles.includes(name) && await this.itemMap[name].resolveUserFilters(params)) {
                    roles.push(name);
                }
            }
        }
        return roles;
    }

    getAccess (assignments, data, params) {
        return (new this.MetaInspector({
            'rbac': this,
            'assignments': assignments,
            'params': params,
            ...data
        })).execute();
    }

    getAttrAccess (assignments, data, params) {
        return (new this.MetaAttrInspector({
            'rbac': this,
            'assignments': assignments,
            'params': params,
            ...data
        })).execute();
    }

    getTransitionAccess (assignments, data, params) {
        return (new this.MetaTransitionInspector({
            'rbac': this,
            'assignments': 'assignments',
            'params': params,
            ...data
        })).execute();
    }

    getNavAccess (assignments, data) {
        return (new this.MetaNavInspector({
            'rbac': this,
            'assignments': assignments
        })).execute(data);
    }

    // DEFAULTS

    async createByData (data) {
        if (data) {
            await this.store.createUserFilters(data.userFilters);
            await super.createByData(data);
        }
    }

    async createMetaByData (data, project) {
        if (data) {
            await this.createByData(data);
            await this.store.createMetaItems(data.meta, project);
        }
    }
};
module.exports.init();

const ArrayHelper = require('areto/helper/ArrayHelper');
const ObjectHelper = require('areto/helper/ObjectHelper');
const MetaObjectFilter = require('./MetaObjectFilter');
const UserFilterFactory = require('./UserFilterFactory');