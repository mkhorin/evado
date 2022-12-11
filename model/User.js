/**
 * @copyright Copyright (c) 2020 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const Base = require('areto/db/ActiveRecord');

module.exports = class User extends Base {

    static getConstants () {
        return {
            TABLE: 'sys_user',
            ATTRS: [
                '_id',
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
            INDEXES: [
                [{email: 1}, {unique: true}]
            ],
            RULES: [
                [['name', 'email'], 'required'],
                ['name', 'regex', {pattern: /^[a-z0-9а-я\s-]+$/i}],
                ['email', 'email'],
                [['blocked', 'verified', 'expiredPassword'], 'checkbox'],
                ['unlockAt', 'date'],
                ['name', 'unique', {
                    ignoreCase: true,
                    skipOnAnyError: true,
                    message: 'auth.nameAlreadyTaken'
                }],
                ['email', 'unique', {
                    ignoreCase: true,
                    skipOnAnyError: true,
                    message: 'auth.emailAlreadyTaken'
                }]
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

    findByName (name) {
        return this.find({name});
    }

    findSame (name, email) {
        return this.createQuery().andFilter({name}).orFilter({email});
    }

    findByTitle (value) {
        value = EscapeHelper.escapeRegex(value);
        return this.find({
            name: new RegExp(value, 'i')
        });
    }

    async getAssignments () {
        if (!this.assignments) {
            this.assignments = await this.module.getRbac().getUserAssignments(this.getId());
        }
        return this.assignments;
    }

    unlock () {
        return this.directUpdate({blocked: false});
    }

    verify () {
        return this.directUpdate({verified: true});
    }

    output () {
        return {
            _id: this.getId(),
            _title: this.getTitle()
        };
    }

    // EVENTS

    async beforeInsert () {
        await super.beforeInsert();
        this.setAuthKey();
    }

    // NOTIFICATIONS

    findUnreadMessages () {
        return this.relPopupNotifications().and({read: false});
    }

    readMessage (id) {
        const query = this.relPopupNotifications().and(['id', 'message', id]);
        return query.updateAll({read: true});
    }

    // RELATIONS

    relPopupNotifications () {
        const Class = this.getClass('notifier/PopupNotification');
        return this.hasMany(Class, 'user', this.PK);
    }

    // AUTH KEY

    getAuthKey () {
        return this.get('authKey');
    }

    setAuthKey () {
        const key = SecurityHelper.getRandomString(this.AUTH_KEY_LENGTH);
        this.set('authKey', key);
    }

    checkAuthKey (key) {
        return this.getAuthKey() === key;
    }
};
module.exports.init(module);

const EscapeHelper = require('areto/helper/EscapeHelper');
const SecurityHelper = require('areto/helper/SecurityHelper');