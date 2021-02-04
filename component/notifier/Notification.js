/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const Base = require('areto/db/ActiveRecord');

module.exports = class Notification extends Base {

    static getConstants () {
        return {
            TABLE: 'sys_notification_template',
            ATTRS: [
                'active',
                'name',
                'subject',
                'text',
                'methods',
                'users',
                'userFilters',
                'options',
                'recipient',
                'messageTemplate'
            ],
            RULES: [
                [['name', 'subject', 'text', 'methods'], 'required'],
                ['name', 'regex', {pattern: /^[0-9a-zA-Z-]+$/}],
                ['name', 'unique'],
                ['methods', 'filter', {method: 'split'}],
                [['options', 'recipient', 'messageTemplate'], 'json'],
                ['messageTemplate', 'spawn', {BaseClass: require('./MessageTemplate')}],
            ],
            DELETE_ON_UNLINK: [
                'messages'
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
        return ObjectHelper.getValue(key, this.getOptions(), defaults);
    }

    getOptions () {
        return CommonHelper.parseJson(this.get('options'));
    }

    relMessages () {
        const Class = this.getClass('notifier/NotificationMessage');
        return this.hasMany(Class, 'notification', this.PK);
    }

    async createMessage (data, messageSource, recipients) {
        await this.resolveMessageTemplate(data, messageSource);
        recipients = recipients || await this.getRecipients(data);
        const message = this.spawn('notifier/NotificationMessage');
        if (await message.create(this, recipients)) {
            return message;
        }
        const error = 'Message creation failed';
        this.addError('error', error);
        this.log('error', `${error}:`, message.getErrors());
    }

    getMessageTemplateConfig () {
        return CommonHelper.parseJson(this.get('messageTemplate'))
            || this.getClass('notifier/MessageTemplate');
    }

    async resolveMessageTemplate (data, messageSource) {
        try {
            const template = this.spawn(ClassHelper.resolveSpawn(this.getMessageTemplateConfig(), this.module));
            template.data = await template.prepareData(data);
            this.resolveMessageTemplateAttr('subject', template, messageSource);
            this.resolveMessageTemplateAttr('text', template, messageSource);
        } catch (err) {
            this.log('error', 'Message template failed:', err);
        }
    }

    resolveMessageTemplateAttr (name, template, messageSource) {
        this.set(name, template.resolveSubject(this.translate(this.get(name), messageSource)));
    }

    translate (message, source) {
        return this.module.translate(message, null, source);
    }

    async getRecipients (data) {
        const config = CommonHelper.parseJson(this.get('recipient'));
        if (!config) {
            return null;
        }
        try {
            const filter = this.spawn(ClassHelper.resolveSpawn(config, this.module));
            return filter.getUsers(data);
        } catch (err) {
            this.log('error', 'Recipient filter failed:', err);
        }
    }

    async getRecipientUsers () {
        let users = this.get('users');
        users = Array.isArray(users) ? users : [];
        const filters = this.get('userFilters');
        if (Array.isArray(filters)) {
            for (const filter of filters) {
                users.push(...await this.getRecipientUsersByFilter(filter));
            }
        }
        return users;
    }

    async getRecipientUsersByFilter (id) {
        const model = await this.spawn('model/UserFilter').findById(id).one();
        return model ? model.getUsers() : [];
    }
};
module.exports.init(module);

const ClassHelper = require('areto/helper/ClassHelper');
const CommonHelper = require('areto/helper/CommonHelper');
const ObjectHelper = require('areto/helper/ObjectHelper');