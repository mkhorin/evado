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
            'tablePrefix': 'sys_rbac_',
            ...config
        });
    }

    async loadData () {
        return Object.assign(await super.loadData(), {
            'metaItems': await this.findMetaItem().all(),
            'userFilters': await this.find(this.TABLE_USER_FILTER).all()
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
        if (data.metaItems instanceof Array) {
            for (let item of data.metaItems) {
                this.prepareMetaItem(item, data);
            }
        }
    }

    prepareMetaItem (item, data) {
        let roles = [];
        let items = item.roles instanceof Array ? item.roles : [];
        for (let key of items) {
            if (Object.prototype.hasOwnProperty.call(data.itemMap, key)) {
                roles.push(data.itemMap[key].name);
            }
        }
        item.roles = roles;
        item.key = this.getItemKey(item);
        item.rule = data.ruleMap.hasOwnProperty(item.rule)
            ? data.ruleMap[item.rule].name
            : null;
    }

    getItemKey (item) {
        let view = `${item.view}.${item.class}.${item.project}`;
        switch (item.targetType) {
            case this.rbac.ALL:
                return this.rbac.ALL;
            case this.rbac.TARGET_PROJECT:
                return item.project;
            case this.rbac.TARGET_CLASS:
                return `${item.class}.${item.project}`;
            case this.rbac.TARGET_VIEW:
                return `${view}`;
            case this.rbac.TARGET_STATE:
                return `${item.state}.${view}`;
            case this.rbac.TARGET_OBJECT:
                return `${item.object}.${item.state}.${view}`;
            case this.rbac.TRANSITION_TARGET:
                return `${item.transition}.${item.object}.${item.class}.${item.project}`;
            case this.rbac.TARGET_ATTR:
                return `${item.attr}.${item.object}.${item.state}.${view}`;
            case this.rbac.TARGET_NAV_SECTION:
                return `${item.navSection}.${item.project}`;
            case this.rbac.TARGET_NAV_ITEM:
                return `${item.navItem}.${item.navSection}.${item.project}`;
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

    async createMetaItems (items, project) {
        if (items instanceof Array) {
            for (let data of items) {
                await (new this.rbac.Item({
                    'data': data,
                    'project': project,
                    'store': this
                })).createMeta();
            }
        }
    }
};
module.exports.init();