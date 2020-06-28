/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const Base = require('areto/db/ActiveRecord');

module.exports = class Notice extends Base {

    static getConstants () {
        return {
            TABLE: 'sys_notice',
            ATTRS: [
                'active',
                'name',
                'subject',
                'text',
                'methods',
                'users',
                'userFilters',
                'options'
            ],
            RULES: [
                [['name', 'subject', 'text', 'methods'], 'required'],
                ['name', 'regex', {pattern: /^[0-9a-zA-Z-]+$/}],
                ['name', 'unique'],
                ['options', 'json']
            ],
            UNLINK_ON_DELETE: [
                'noticeMessages'
            ]
        };
    }

    getTitle () {
        return this.get('name');
    }

    getOption (key, defaults) {
        return ObjectHelper.getValue(key, this.get('options'), defaults);
    }

    relNoticeMessages () {
        const Class = this.getClass('notifier/NoticeMessage');
        return this.hasMany(Class, 'notice', this.PK).deleteOnUnlink();
    }

    async createMessage (data) {
        this.resolveTemplate(data);
        const message = this.spawn('notifier/NoticeMessage');
        if (await message.create(this, data)) {
            return message;
        }
        const error = 'Message creation failed';
        this.addError('error', error);
        this.log('error', `${error}:`, message.getErrors());
    }

    resolveTemplate (data) {
        try {
            const config = this.getOption('MessageTemplate') || this.getClass('notifier/MessageTemplate');
            const Class = ClassHelper.resolveSpawn(config, this.module);
            const template = this.spawn(Class, {data});
            this.set('subject', template.resolveSubject(this.get('subject')));
            this.set('text', template.resolveText(this.get('text')));
        } catch (err) {
            this.log('error', 'Invalid message template:', err);
        }
    }

    async getUsers (data) {
        let users = this.get('users');
        users = Array.isArray(users) ? users : [];
        const filters = this.get('userFilters');
        if (Array.isArray(filters)) {
            for (const id of filters) {
                users.push(...await this.getUsersByFilter(id, data));
            }
        }
        return users;
    }

    async getUsersByFilter (id, data) {
        const model = await this.spawn('notifier/UserFilter').findById(id).one();
        return model ? model.getUsers(data) : [];
    }
};
module.exports.init(module);

const ClassHelper = require('areto/helper/ClassHelper');
const ObjectHelper = require('areto/helper/ObjectHelper');