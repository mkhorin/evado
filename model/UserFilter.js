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
        users.push(...await this.resolveCustomFilterUsers());
        users.push(...await this.resolveRbacItemUsers());
        users = MongoHelper.exclude(this.get('excludes'), users);
        return users;
    }

    async resolveRbacItemUsers () {
        const result = [];
        const rbac = this.module.getRbac();
        for (let item of this.get('items')) {
            item = rbac.store.getItem(item);
            if (item) {
                if (Array.isArray(rbac.itemUserMap[item.name])) {
                    result.push(...rbac.itemUserMap[item.name]);
                }
                item = rbac.itemMap[item.name];
                if (item) {
                    result.push(...await item.getAssignmentUsers());
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