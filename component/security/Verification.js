/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const Base = require('areto/db/ActiveRecord');

module.exports = class Verification extends Base {

    static getConstants () {
        return {
            TABLE: 'sys_verification',
            ATTRS: [
                'user',
                'key',
                'createdAt',
                'done'
            ],
            INDEXES: [[{user: 1}, {unique: true}]],
            RULES: [
            ]
        };
    }

    isDone () {
        return this.get('done');
    }

    isExpired (duration) {
        return DateHelper.isExpired(this.get('createdAt'), duration);
    }

    getElapsedTime () {
        return Date.now() - this.get('createdAt').valueOf();
    }

    findByUser (id) {
        return this.find({user: id});
    }

    setNewKey (userId, ...args) {
        this.set('key', this.createKey(...args));
        this.set('user', userId);
        this.set('createdAt', new Date);
        this.set('done', false);
    }

    createKey (length = 16) {
        return SecurityHelper.getRandomString(length);
    }

    execute () {
        return this.directUpdate({done: true});
    }
};
module.exports.init(module);

const DateHelper = require('areto/helper/DateHelper');
const SecurityHelper = require('areto/helper/SecurityHelper');