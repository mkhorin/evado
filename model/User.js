'use strict';

const STATUS_ACTIVE = 'active';
const STATUS_BANNED = 'banned';

const Base = require('areto/db/ActiveRecord');

module.exports = class User extends Base {

    static getConstants () {
        return {
            TABLE: 'sys_user',
            ATTRS: [
                'name', 
                'email',
                'status',
                'createdAt',
                'updatedAt',
                'passwordHash', 
                'authKey'
            ],
            BEHAVIORS: {
                'timestamp': require('areto/behavior/TimestampBehavior')
            },
            RULES: [
                ['status', 'default', {value: 'active'}],
                [['name', 'email', 'status'], 'required'],
                ['name', 'regexp', {pattern: /^[а-яa-z0-9\s-]+$/i}],
                ['email', 'email'],
                ['password', 'required', {on: 'create'}],
                ['password', 'string'],
                [['name', 'email'], 'unique', {
                    skipOnAnyError: true,
                    ignoreCase: true
                }]
            ],
            ATTR_VALUE_LABELS: {
                'status': {
                    [STATUS_ACTIVE]: 'Active',
                    [STATUS_BANNED]: 'Banned'
                }
            },
            STATUS_ACTIVE,
            STATUS_BANNED,
            AUTH_KEY_LENGTH: 16
        };
    }

    findIdentity (id) {
        return this.findById(id).and({status: STATUS_ACTIVE});
    }

    findByEmail (email) {
        return this.find({email});
    }

    findSame (name, email) {
        return this.find().andFilter({name}).orFilter({email});
    }

    getTitle () {
        return this.get('name');
    }
    
    isActive () {
        return this.get('status') === STATUS_ACTIVE;
    }

    isBanned () {
        return this.get('status') === STATUS_BANNED;
    }

    async getAssignments () {
        if (!this.assignments) {
            this.assignments = await this.module.get('rbac').getUserAssignments(this.getId());
        }
        return this.assignments;        
    }

    toJSON () {
        return this.getTitle();
    }

    // EVENTS

    async beforeSave (insert) {
        await super.beforeSave(insert);
        this.setPasswordHash();
        if (insert) {
            this.setAuthKey();
        }
    }
   
    // PASSWORD

    setPassword (password) {
        this.set('password', password);
    }

    validatePassword (password) {
        return SecurityHelper.validatePassword(password, this.get('passwordHash'));
    }

    setPasswordHash () {
        if (this.get('password')) {
            this.set('passwordHash', SecurityHelper.hashPassword(this.get('password')));
        }
    }

    // AUTH key to remember me cookies

    validateAuthKey (key) {
        return this.getAuthKey() === key;
    }

    getAuthKey () {
        return this.get('authKey');
    }

    setAuthKey () {
        this.set('authKey', SecurityHelper.getRandomString(this.AUTH_KEY_LENGTH));
    }
};
module.exports.init();

const SecurityHelper = require('areto/helper/SecurityHelper');