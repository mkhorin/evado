'use strict';

const Base = require('areto/rbac/Item');

module.exports = class Item extends Base {

    setUserFilters (map) {
        let filters = [];
        if (Array.isArray(this.userFilters)) {
            for (let key of this.userFilters) {
                if (map[key] instanceof UserFilterFactory) {
                    filters.push(map[key]);
                }
            }
        }
        this.userFilters = filters;
    }

    async resolveUserFilters (params) {
        if (Array.isArray(this.userFilters)) {
            for (let filter of this.userFilters) {
                if (await filter.resolve(params)) {
                    return true;
                }            
            }
        }
    }

    // CREATE

    async resolveRelations () {
        let result = await super.resolveRelations();
        await this.resolveUserFilterRelation(result);
        return result;
    }

    async resolveUserFilterRelation (result) {
        let data = this.data.userFilters;
        if (!(data instanceof Array) || !data.length) {
            return result.userFilters = [];
        }
        result.userFilters = await this.store.findUserFilterByName(data).column(this.store.key);         
        if (ids.length !== data.length) {
            throw new Error(`RBAC: Not found user filter for item: ${this.name}`);
        }
    }

    async createMeta () {
        this.data.project = this.project.name;
        await this.validateMetaData();
        let [roles, rule] = await this.prepareMetaData();
        let items = await this.store.findMetaItem().and(this.getMetaCondition()).all();
        for (let item of items) {
            if (this.compareMeta(item)) {
                return this.project.log('warn', this.getMetaDataError('Meta item already exists'));
            }
        }
        if (this.data.rule && !rule) {
            throw new Error(this.getMetaDataError('Not found rule for meta item'));
        }
        let doc = {...this.data};
        doc.roles = roles;
        doc.rule = rule ? rule[this.store.key] : null;
        return this.store.findMetaItem().insert(doc);
    }

    getMetaCondition () {
        let condition = {...this.data};
        for (let key of Object.keys(condition)) {
            condition[key] = condition[key] || '';
        }
        ObjectHelper.deleteProps(['rule', 'actions', 'roles'], condition);
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
                throw new Error(this.getMetaDataError(`Not found meta item rule`));    
            }
        }
        for (let name of this.data.roles) {
            let role = await this.store.findRoleItem().and({name}).one();
            if (!role) {
                throw new Error(this.getMetaDataError(`Not found '${name}' role`));
            }
            roles.push(role[this.store.key]);
        }
        return [roles, rule];
    }

    validateMetaData () {
        if (!this.store.rbac.constructor.isMetaItemType(this.data.type)) {
            throw new Error(this.getMetaDataError('Invalid meta item type'));
        }
        if (!this.store.rbac.constructor.isMetaItemTargetType(this.data.targetType)) {
            throw new Error(this.getMetaDataError('Invalid meta item target type'));
        }
        let cls = this.project.getClass(this.data.class);
        if (this.data.class && !cls) {
            throw new Error(this.getMetaDataError('Invalid meta item class'));
        }
        let view = cls && cls.getView(this.data.view);
        if (this.data.view && !view) {
            throw new Error(this.getMetaDataError('Invalid meta item view'));
        }
    }

    getMetaDataError (message) {
        return `RBAC: ${message}: ${JSON.stringify(this.data)}`;
    }

    compareMeta (item) {
        if (ArrayHelper.diff(item.actions, this.data.actions).length) {
            return false;
        }
        return true;
    }
};

const ArrayHelper = require('areto/helper/ArrayHelper');
const ObjectHelper = require('areto/helper/ObjectHelper');
const UserFilterFactory = require('./UserFilterFactory');