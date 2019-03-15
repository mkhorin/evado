'use strict';

const Base = require('areto/db/ActiveRecord');

module.exports = class UserLog extends Base {

    static getConstants () {
        return {
            TABLE: 'sys_userLog',
            ATTRS: [
                'action',
                'data',
                'user',
                'ip',
                'createdAt'
            ],
            ACTION_LOGIN: 'login',
            ACTION_SIGN_UP: 'signUp',
        };
    }

    log (values) {
        Object.assign(this._attrs, values, {
            'createdAt': new Date
        });
        return this.forceSave();
    }

    relUser () {
        return this.hasOne(User, User.PK, 'user');
    }
};
module.exports.init(module);

const User = require('./User');