/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const Base = require('areto/security/rbac/DatabaseRbacStore');

module.exports = class DatabaseStore extends Base {

    static getConstants () {
        return {
            TABLE_META_ITEM: 'meta_item',
            TABLE_ASSIGNMENT_FILTER: 'assignment_filter'
        };
    }

    constructor (config) {
        super({
            tablePrefix: 'sys_rbac_',
            ...config
        });
    }

    async loadData () {
        return Object.assign(await super.loadData(), {
            metaItems: await this.findMetaItem().all(),
            assignmentFilters: await this.findAssignmentFilter().all()
        });
    }

    findMetaItem () {
        return this.find(this.TABLE_META_ITEM);
    }

    findAssignmentFilter () {
        return this.find(this.TABLE_ASSIGNMENT_FILTER);
    }

    findAssignmentFilterByName (name) {
        return this.findAssignmentFilter().and({name});
    }

    prepare (data) {
        const result = super.prepare(data);
        this.prepareMetaItems(data);
        result.metaItems = data.metaItems;
        result.assignmentFilters = data.assignmentFilters;
        return result;
    }

    prepareMetaItems (data) {
        if (Array.isArray(data.metaItems)) {
            for (const item of data.metaItems) {
                this.prepareMetaItem(item, data);
            }
        }
    }

    prepareMetaItem (item, data) {
        const roles = [];
        const items = Array.isArray(item.roles) ? item.roles : [];
        for (const key of items) {
            if (Object.prototype.hasOwnProperty.call(data.itemMap, key)) {
                roles.push(data.itemMap[key].name);
            }
        }
        item.roles = roles;
        item.key = this.getItemKey(item);
        item.rule = Object.prototype.hasOwnProperty.call(data.ruleMap, item.rule)
            ? data.ruleMap[item.rule].name
            : null;
    }

    getItemKey (item) {
        const view = `${item.view}.${item.class}`;
        switch (item.targetType) {
            case this.rbac.ALL:
                return this.rbac.ALL;
            case this.rbac.TARGET_CLASS:
                return `${item.class}`;
            case this.rbac.TARGET_VIEW:
                return `${view}`;
            case this.rbac.TARGET_STATE:
                return `${item.state}.${view}`;
            case this.rbac.TARGET_OBJECT:
                return `${item.object}.${item.state}.${view}`;
            case this.rbac.TARGET_TRANSITION:
                return `${item.transition}.${item.object}.${item.class}`;
            case this.rbac.TARGET_ATTR:
                return `${item.attr}.${item.object}.${item.state}.${view}`;
            case this.rbac.TARGET_NAV_SECTION:
                return `${item.navSection}`;
            case this.rbac.TARGET_NAV_NODE:
                return `${item.navNode}.${item.navSection}`;
        }
    }

    // CREATE

    async createAssignmentFilters (data) {
        if (data) {
            for (const name of Object.keys(data)) {
                await this.createAssignmentFilter(name, data[name]);
            }
        }
    }

    async createAssignmentFilter (name, data) {
        const filter = await this.findAssignmentFilterByName(name).one();
        if (filter) {
            return this.log('warn', `Assignment filter already exists: ${name}`);
        }
        return this.findAssignmentFilter().insert({name, ...data});
    }

    async createMetaItems (items) {
        if (Array.isArray(items)) {
            for (const data of items) {
                await (new this.rbac.Item({store: this, data})).createMeta();
            }
        }
    }
};
module.exports.init();