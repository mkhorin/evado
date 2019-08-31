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
                'condition'
            ]
        };
    }

    async resolve () {
        let users = this.get('includes');
        users = Array.isArray(users) ? users: [];
        users.push(...await this.resolveCondition());
        const excludes = ArrayHelper.flip(this.get('excludes'));
        for (let i = users.length - 1; i >= 0; --i) {
            if (excludes.hasOwnProperty(users[i])) {
                users.splice(i, 1);
            }
        }
        return users;
    }

    resolveCondition () { // query condition or class Condition
        return [];
    }

};
module.exports.init(module);

const ArrayHelper = require('areto/helper/ArrayHelper');