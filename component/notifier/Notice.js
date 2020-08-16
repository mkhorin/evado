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
            DELETE_ON_UNLINK: [
                'noticeMessages'
            ]
        };
    }

    getTitle () {
        return this.get('name');
    }

    toString () {
        return `${this.constructor.name}: ${this.get('name')}`;
    }

    getOption (key, defaults) {
        return ObjectHelper.getValue(key, this.get('options'), defaults);
    }

    relNoticeMessages () {
        const Class = this.getClass('notifier/NoticeMessage');
        return this.hasMany(Class, 'notice', this.PK);
    }

    async createMessage (data) {
        this.resolveTemplate(...arguments);
        const message = this.spawn('notifier/NoticeMessage');
        if (await message.create(this, data)) {
            return message;
        }
        const error = 'Message creation failed';
        this.addError('error', error);
        this.log('error', `${error}:`, message.getErrors());
    }

    resolveTemplate (data, messageSource) {
        try {
            const config = this.getOption('MessageTemplate') || this.getClass('notifier/MessageTemplate');
            const Class = ClassHelper.resolveSpawn(config, this.module);
            const template = this.spawn(Class, {data});
            this.resolveTemplateAttr('subject', template, messageSource);
            this.resolveTemplateAttr('text', template, messageSource);
        } catch (err) {
            this.log('error', 'Invalid message template:', err);
        }
    }

    resolveTemplateAttr (name, template, messageSource) {
        this.set(name, template.resolveSubject(this.translate(this.get(name), messageSource)));
    }

    translate (message, source) {
        return this.module.translate(message, null, source);
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
        const model = await this.spawn('model/UserFilter').findById(id).one();
        return model ? model.getUsers(data) : [];
    }
};
module.exports.init(module);

const ClassHelper = require('areto/helper/ClassHelper');
const ObjectHelper = require('areto/helper/ObjectHelper');