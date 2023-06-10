/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const Base = require('areto/security/rbac/DatabaseRbacStore');

module.exports = class DatabaseStore extends Base {

    static getConstants () {
        return {
            TABLE_META_ITEM: 'meta_item',
            TABLE_META_TARGET: 'meta_target',
            TABLE_ASSIGNMENT_RULE: 'assignment_rule'
        };
    }

    constructor (config) {
        super({
            tablePrefix: 'sys_rbac_',
            ...config
        });
    }

    async clearAll () {
        const db = this.getDb();
        await db.truncate(this.getTableName(this.TABLE_META_ITEM));
        await db.truncate(this.getTableName(this.TABLE_META_TARGET));
        await db.truncate(this.getTableName(this.TABLE_ASSIGNMENT_RULE));
        await super.clearAll();
    }

    async loadData () {
        this.data = await super.loadData();
        const metaTargets = await this.findMetaTarget().all();
        const metaItems = await this.findMetaItem().all();
        const assignmentRules = await this.findAssignmentRule().all();
        return Object.assign(this.data, {metaTargets, metaItems, assignmentRules});
    }

    getItem (id) {
        return this.data.itemMap[id];
    }

    findMetaItem () {
        return this.find(this.TABLE_META_ITEM);
    }

    findMetaTarget () {
        return this.find(this.TABLE_META_TARGET);
    }

    findAssignmentRule () {
        return this.find(this.TABLE_ASSIGNMENT_RULE).and({active: true});
    }

    findAssignmentRuleByName (name) {
        return this.findAssignmentRule().and({name});
    }

    prepare (data) {
        const result = super.prepare(data);
        this.prepareMeta(data);
        result.metaItems = data.metaItems;
        this.prepareAssignmentRules(data.assignmentRules);
        result.assignmentRules = data.assignmentRules;
        return result;
    }

    prepareAssignmentRules (items) {
        for (const item of items) {
            item.config = CommonHelper.parseJson(item.config);
        }
    }

    prepareMeta (data) {
        const itemMap = this.indexMetaItems(data);
        data.metaItems = [];
        for (const target of data.metaTargets) {
            if (itemMap[target.item]) {
                data.metaItems.push({
                    ...itemMap[target.item],
                    ...this.prepareMetaTarget(target)
                });
            }
        }
    }

    indexMetaItems (data) {
        const result = {};
        for (const item of data.metaItems) {
            this.prepareMetaItem(item, data);
            if (item.actions?.length && item.roles?.length) {
                result[item._id] = item;
                delete item._id;
            }
        }
        return result;
    }

    prepareMetaItem (item, data) {
        item.roles = this.prepareMetaItemRoles(item, data);
        item.actions = this.prepareMetaItemActions(item, data);
        item.rules = this.prepareMetaItemRules(item, data);
    }

    prepareMetaItemRoles (item, {itemMap}) {
        const roles = [];
        if (Array.isArray(item.roles)) {
            for (const key of item.roles) {
                Object.hasOwn(itemMap, key)
                    ? roles.push(itemMap[key].name)
                    : this.log('error', `Role not found: ${key}`);
            }
        }
        return roles;
    }

    prepareMetaItemActions ({actions}) {
        return Array.isArray(actions) ? actions : [];
    }

    prepareMetaItemRules (item, {ruleMap}) {
        return this.getItemRules(item, ruleMap);
    }

    prepareMetaTarget (data) {
        data.targetType = data.type;
        data.key = this.getItemKey(data);
        delete data._id;
        delete data.type;
        delete data.item;
        return data;
    }

    getItemKey (data) {
        const empty = '';
        const cls = data.class || empty;
        const view = cls ? `${data.view || empty}.${cls}` : empty;
        const state = data.state || empty;
        const object = data.object || empty;
        switch (data.type) {
            case this.rbac.ALL: {
                return empty;
            }
            case this.rbac.TARGET_CLASS: {
                return cls;
            }
            case this.rbac.TARGET_VIEW: {
                return view;
            }
            case this.rbac.TARGET_STATE: {
                return view ? `${state}.${view}` : empty;
            }
            case this.rbac.TARGET_OBJECT: {
                return view ? `${object}.${state}.${view}` : empty;
            }
            case this.rbac.TARGET_TRANSITION: {
                return cls ? `${data.transition || empty}.${object}.${cls}` : empty;
            }
            case this.rbac.TARGET_ATTR: {
                return `${data.attr}.${object}.${state}.${view}`;
            }
            case this.rbac.TARGET_SECTION: {
                return data.section || empty;
            }
            case this.rbac.TARGET_NODE: {
                return data.section ? `${data.node || empty}.${data.section}` : empty;
            }
        }
    }

    // CREATE

    async createAssignmentRules (data) {
        if (data) {
            for (const name of Object.keys(data)) {
                await this.createAssignmentRule(name, data[name]);
            }
        }
    }

    async createAssignmentRule (name, data) {
        const query = this.findAssignmentRuleByName(name);
        const rule = await query.one();
        if (rule) {
            this.log('warn', `Assignment rule already exists: ${name}`)
        } else {
            const query = this.findAssignmentRule();
            await query.insert({name, ...data});
        }
    }

    async createMetaItems (items) {
        if (Array.isArray(items)) {
            for (const data of items) {
                const item = new this.rbac.Item({store: this, data});
                await item.createMeta();
            }
        }
    }
};
module.exports.init();

const CommonHelper = require('areto/helper/CommonHelper');