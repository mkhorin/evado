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
                'header',
                'content',
                'methods',
                'users',
                'userFilters',
                'options'
            ],
            UNLINK_ON_REMOVE: [
                'noticeMessages'
            ]
        };
    }

    getOption (key, defaults) {
        return ObjectHelper.getValue(key, this.get('options'), defaults);
    }

    relNoticeMessages () {
        const Class = this.getClass('notifier/NoticeMessage');
        return this.hasMany(Class, 'notice', this.PK).removeOnUnlink();
    }

    // EXECUTE

    async execute (data) {
        this.data = data;
        this.resolveTemplate();
        for (const method of this.get('methods')) {
            await this.notify(method);
        }
    }

    notify (method) {
        switch (method) {
            case 'message': return this.notifyByMessage();
            case 'email': return this.notifyByEmail();
        }
    }

    resolveTemplate () {
        try {
            const config = this.getOption('MessageTemplate') || this.getClass('notifier/MessageTemplate');
            const Class = ClassHelper.resolveSpawn(config, this.module);
            const template = this.spawn(Class, {data: this.data});
            this.set('header', template.resolveHeader(this.get('header')));
            this.set('content', template.resolveContent(this.get('content')));
        } catch (err) {
            this.log('error', 'Invalid message template:', err);
        }
    }

    // MESSAGE

    async notifyByMessage () {
        const model = this.spawn('notifier/NoticeMessage');
        if (!await model.create(this)) {
            const error = `Message creation failed`;
            this.addError('error', error);
            this.log('error', `${error}:`, model.getErrors());
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

    // EMAIL

    notifyByEmail () {
        // this.module.getMailer().execute(this);
    }
};
module.exports.init(module);

const ClassHelper = require('areto/helper/ClassHelper');
const ObjectHelper = require('areto/helper/ObjectHelper');