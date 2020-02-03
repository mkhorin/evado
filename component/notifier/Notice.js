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
                'subject',
                'text',
                'methods',
                'users',
                'userFilters',
                'options'
            ],
            UNLINK_ON_DELETE: [
                'noticeMessages'
            ]
        };
    }

    getTitle () {
        return this.get('subject');
    }

    getOption (key, defaults) {
        return ObjectHelper.getValue(key, this.get('options'), defaults);
    }

    relNoticeMessages () {
        const Class = this.getClass('notifier/NoticeMessage');
        return this.hasMany(Class, 'notice', this.PK).deleteOnUnlink();
    }

    // EXECUTE

    async execute (data) {
        this.data = data;
        this.resolveTemplate();
        const model = this.spawn('notifier/NoticeMessage');
        if (!await model.create(this)) {
            const error = 'Message creation failed';
            this.addError('error', error);
            this.log('error', `${error}:`, model.getErrors());
        }
    }

    resolveTemplate () {
        try {
            const config = this.getOption('MessageTemplate') || this.getClass('notifier/MessageTemplate');
            const Class = ClassHelper.resolveSpawn(config, this.module);
            const template = this.spawn(Class, {data: this.data});
            this.set('subject', template.resolveSubject(this.get('subject')));
            this.set('text', template.resolveText(this.get('text')));
        } catch (err) {
            this.log('error', 'Invalid message template:', err);
        }
    }

    async getUsers () {
        let users = this.get('users');
        users = Array.isArray(users) ? users : [];
        const filters = this.get('userFilters');
        if (Array.isArray(filters)) {
            for (const id of filters) {
                users.push(...await this.getUsersByFilter(id));
            }
        }
        return users;
    }

    async getUsersByFilter (id) {
        const model = await this.spawn('notifier/UserFilter').findById(id).one();
        return model ? model.getUsers() : [];
    }
};
module.exports.init(module);

const ClassHelper = require('areto/helper/ClassHelper');
const ObjectHelper = require('areto/helper/ObjectHelper');