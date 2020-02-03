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
                'description',
                'items',
                'includes',
                'excludes',
                'config'
            ]
        };
    }

    async getUsers () {
        let users = this.get('includes');
        users = Array.isArray(users) ? users: [];
        users.push(...await this.resolveConfig());
        users.push(...await this.resolveRbacItems());
        users = MongoHelper.exclude(this.get('excludes'), users);
        return users;
    }

    async resolveRbacItems () {
        const rbac = this.module.getRbac();
        const result = [];
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

    resolveConfig () {
        const data = this.get('config');
        if (!data) {
            return [];
        }
        try {
            const config = ClassHelper.resolveSpawn(CommonHelper.parseJson(data), this.module);
            return this.spawn(config).getUsers();
        } catch (err) {
            this.log('error', 'Invalid configuration:', err);
            return [];
        }
    }
};
module.exports.init(module);

const ClassHelper = require('areto/helper/ClassHelper');
const CommonHelper = require('areto/helper/CommonHelper');
const MongoHelper = require('areto/helper/MongoHelper');