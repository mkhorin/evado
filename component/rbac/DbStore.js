/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const Base = require('areto/rbac/DbStore');

module.exports = class DbStore extends Base {

    static getConstants () {
        return {
            TABLE_META_ITEM: 'meta_item',
            TABLE_USER_FILTER: 'user_filter'
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
            userFilters: await this.find(this.TABLE_USER_FILTER).all()
        });
    }

    findMetaItem () {
        return this.find(this.TABLE_META_ITEM);
    }

    findUserFilter () {
        return this.find(this.TABLE_USER_FILTER);
    }

    findUserFilterByName (name) {
        return this.findUserFilter().and({name});
    }

    prepare (data) {
        let result = super.prepare(data);
        this.prepareMetaItems(data);
        result.metaItems = data.metaItems;
        result.userFilters = data.userFilters;
        return result;
    }

    prepareMetaItems (data) {
        if (Array.isArray(data.metaItems)) {
            for (let item of data.metaItems) {
                this.prepareMetaItem(item, data);
            }
        }
    }

    prepareMetaItem (item, data) {
        let roles = [];
        let items = Array.isArray(item.roles) ? item.roles : [];
        for (let key of items) {
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
        let view = `${item.view}.${item.class}`;
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
            case this.rbac.TARGET_NAV_ITEM:
                return `${item.navItem}.${item.navSection}`;
        }
    }

    // CREATE

    async createUserFilters (data) {
        if (data) {
            for (let name of Object.keys(data)) {
                await this.createUserFilter(name, data[name]);
            }
        }
    }

    async createUserFilter (name, data) {
        let filter = await this.findUserFilterByName(name).one();
        if (filter) {
            return this.log('warn', `RBAC: User filter already exists: ${name}`);
        }
        return this.findUserFilter().insert({name, ...data});
    }

    async createMetaItems (items) {
        if (Array.isArray(items)) {
            for (let data of items) {
                await (new this.rbac.Item({store: this, data})).createMeta();
            }
        }
    }
};
module.exports.init();