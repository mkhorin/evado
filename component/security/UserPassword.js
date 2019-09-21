/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const Base = require('areto/db/ActiveRecord');

module.exports = class UserPassword extends Base {

    static getConstants () {
        return {
            TABLE: 'sys_userPassword',
            ATTRS: [
                'user',
                'createdAt',
                'hash'
            ],
            INDEXES: [[{user: 1}, {unique: false}]],
            RULES: [
                ['password', (attr, model)=> model.spawn('security/PasswordValidator').validateAttr(attr, model)]
            ]
        };
    }

    static isUsed (password, models) {
        for (const model of models) {
            if (model.check(password)) {
                return true;
            }
        }
    }

    isExpired (duration) {
        return DateHelper.isExpired(this.get('createdAt'), duration);
    }

    findByUser (id) {
        return this.find({user: id}).order({[this.PK]: -1});
    }

    check (password, hash) {
        return SecurityHelper.checkPassword(password, hash || this.get('hash'));
    }

    hash (password) {
        return SecurityHelper.hashPassword(password);
    }

    async beforeSave (insert) {
        await super.beforeSave(insert);
        this.setNewPassword(this.get('password'));
    }

    setNewPassword (password) {
        if (password) {
            this.set('hash', this.hash(password));
            this.set('createdAt', new Date);
        }
    }
};
module.exports.init(module);

const DateHelper = require('areto/helper/DateHelper');
const SecurityHelper = require('areto/helper/SecurityHelper');