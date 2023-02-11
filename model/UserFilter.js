/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const Base = require('areto/db/ActiveRecord');

module.exports = class UserFilter extends Base {

    static getConstants () {
        return {
            TABLE: 'sys_userFilter',
            ATTRS: [
                'name',
                'label',
                'description',
                'items',
                'includes',
                'excludes',
                'config'
            ],
            RULES: [
                ['name', 'required'],
                [['name', 'label', 'description'], 'string'],
                ['name', 'regex', {pattern: /^[0-9a-zA-Z-]+$/}],
                ['name', 'unique'],
                ['config', 'spawn']
            ]
        };
    }

    getTitle () {
        return this.get('name');
    }

    toString () {
        return `${this.constructor.name}: ${this.get('name')}`;
    }

    async getUsers () {
        let users = this.get('includes');
        users = Array.isArray(users) ? users: [];
        const customUsers = await this.resolveCustomFilterUsers();
        users.push(...customUsers);
        const rbacUsers = await this.resolveRbacItemUsers();
        users.push(...rbacUsers);
        const excludedUsers = this.get('excludes');
        users = MongoHelper.exclude(excludedUsers, users);
        return users;
    }

    async resolveRbacItemUsers () {
        const result = [];
        const rbac = this.module.getRbac();
        const items = this.get('items');
        for (let item of items) {
            item = rbac.store.getItem(item);
            if (item) {
                if (Array.isArray(rbac.itemUserMap[item.name])) {
                    result.push(...rbac.itemUserMap[item.name]);
                }
                item = rbac.itemMap[item.name];
                if (item) {
                    const users = await item.getAssignmentUsers();
                    result.push(...users);
                }
            }
        }
        return result;
    }

    resolveCustomFilterUsers () {
        const data = this.get('config');
        if (!data) {
            return [];
        }
        try {
            const json = CommonHelper.parseJson(data);
            const config = ClassHelper.resolveSpawn(json, this.module);
            return this.spawn(config).getUsers();
        } catch (err) {
            this.log('error', 'Invalid configuration', err);
            return [];
        }
    }
};
module.exports.init(module);

const ClassHelper = require('areto/helper/ClassHelper');
const CommonHelper = require('areto/helper/CommonHelper');
const MongoHelper = require('areto/helper/MongoHelper');