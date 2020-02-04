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
        return Object.assign(this.data, {
            metaTargets: await this.findMetaTarget().all(),
            metaItems: await this.findMetaItem().all(),
            assignmentRules: await this.findAssignmentRule().all()
        });
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
        return this.find(this.TABLE_ASSIGNMENT_RULE);
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
            if (item.actions.length && item.roles.length) {
                result[item._id] = item;
                delete item._id;
            }
        }
        return result;
    }

    prepareMetaItem (item, {itemMap, ruleMap}) {
        const roles = [];
        if (Array.isArray(item.roles)) {
            for (const key of item.roles) {
                if (Object.prototype.hasOwnProperty.call(itemMap, key)) {
                    roles.push(itemMap[key].name);
                }
            }
        }
        item.roles = roles;
        item.actions = Array.isArray(item.actions) ? item.actions : [];
        item.rule = Object.prototype.hasOwnProperty.call(ruleMap, item.rule) ? ruleMap[item.rule].name : null;
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
        const view = `${data.view}.${data.class}`;
        switch (data.type) {
            case this.rbac.ALL:
                return this.rbac.ALL;
            case this.rbac.TARGET_CLASS:
                return `${data.class}`;
            case this.rbac.TARGET_VIEW:
                return `${view}`;
            case this.rbac.TARGET_STATE:
                return `${data.state}.${view}`;
            case this.rbac.TARGET_OBJECT:
                return `${data.object}.${data.state}.${view}`;
            case this.rbac.TARGET_TRANSITION:
                return `${data.transition}.${data.object}.${data.class}`;
            case this.rbac.TARGET_ATTR:
                return `${data.attr}.${data.object}.${data.state}.${view}`;
            case this.rbac.TARGET_NAV_SECTION:
                return `${data.navSection}`;
            case this.rbac.TARGET_NAV_NODE:
                return `${data.navNode}.${data.navSection}`;
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
        const filter = await this.findAssignmentRuleByName(name).one();
        if (filter) {
            return this.log('warn', `Assignment rule already exists: ${name}`);
        }
        return this.findAssignmentRule().insert({name, ...data});
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