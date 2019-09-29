/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const Base = require('areto/db/ActiveRecord');

module.exports = class User extends Base {

    static getConstants () {
        return {
            TABLE: 'sys_user',
            ATTRS: [
                'name', 
                'email',
                'verified',
                'blocked',
                'unlockAt',
                'expiredPassword',
                'createdAt',
                'updatedAt',
                'authKey'
            ],
            INDEXES: [[{email: 1}, {unique: true}]],
            RULES: [
                [['name', 'email'], 'required'],
                ['name', 'regex', {pattern: /^[а-яa-z0-9\s-]+$/i}],
                ['email', 'email'],
                [['blocked', 'verified', 'expiredPassword'], 'checkbox'],
                ['unlockAt', 'date'],
                [['name', 'email'], 'unique', {ignoreCase: true, skipOnAnyError: true}]
            ],
            BEHAVIORS: {
                'timestamp': require('areto/behavior/TimestampBehavior')
            },
            AUTH_KEY_LENGTH: 16
        };
    }

    isBlocked () {
        return this.get('blocked');
    }

    isVerified () {
        return this.get('verified');
    }

    getEmail () {
        return this.get('email');
    }

    getTitle () {
        return this.get('name');
    }

    findIdentity (id) {
        return this.findById(id).and({
            blocked: false,
            verified: true
        });
    }

    findByEmail (email) {
        return this.find({email});
    }

    findSame (name, email) {
        return this.find().andFilter({name}).orFilter({email});
    }

    async getAssignments () {
        if (!this.assignments) {
            this.assignments = await this.module.getRbac().getUserAssignments(this.getId());
        }
        return this.assignments;        
    }

    toJSON () {
        return this.getTitle();
    }

    unlock () {
        return this.directUpdate({blocked: false});
    }

    verify () {
        return this.directUpdate({verified: true});
    }

    // EVENTS

    async beforeInsert () {
        await super.beforeInsert();
        this.setAuthKey();
    }

    // NOTICE

    findUnreadMessages () {
        return this.relNoticeMessageUsers().and({read: false});
    }

    readMessage (id) {
        return this.relNoticeMessageUsers().and(['ID', 'message', id]).updateAll({read: true});
    }

    // RELATIONS

    relNoticeMessageUsers () {
        const Class = this.getClass('notifier/NoticeMessageUser');
        return this.hasMany(Class, 'user', this.PK);
    }

    // AUTH KEY

    getAuthKey () {
        return this.get('authKey');
    }

    setAuthKey () {
        this.set('authKey', SecurityHelper.getRandomString(this.AUTH_KEY_LENGTH));
    }

    checkAuthKey (key) {
        return this.getAuthKey() === key;
    }
};
module.exports.init(module);

const SecurityHelper = require('areto/helper/SecurityHelper');