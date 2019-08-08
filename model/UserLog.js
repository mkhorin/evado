/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
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
        Object.assign(this._attrMap, values, {createdAt: new Date});
        return this.forceSave();
    }

    relUser () {
        const Class = this.getClass('model/User');
        return this.hasOne(Class, Class.PK, 'user');
    }
};
module.exports.init(module);