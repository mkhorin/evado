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
                'event',
                'user',
                'ip',
                'time',
                'data'
            ],
            INDEXES: [[{user: 1}, {unique: false}]],
            OVERFLOW: 30,
            TRUNCATION: 20
        };
    }

    async create (user, event, data, identity) {
        const userId = identity ? identity.getId() : user.getId();
        this.set('user', userId);
        this.set('event', event);
        this.set('ip', user.getIp());
        this.set('time', new Date);
        this.set('data', data);
        await this.forceSave();
        return this.truncate(userId, event);
    }

    async truncate (user, event) {
        return ModelHelper.truncateOverflow({
            query: this.find({user, event}),
            overflow: this.module.getParam('userLogOverflow', this.OVERFLOW),
            truncation: this.module.getParam('userLogTruncation', this.TRUNCATION),
            inBulk: true
        });
    }

    relUser () {
        const Class = this.getClass('model/User');
        return this.hasOne(Class, Class.PK, 'user');
    }
};
module.exports.init(module);

const ModelHelper = require('../component/helper/ModelHelper');