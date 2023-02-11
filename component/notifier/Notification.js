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
        if (!recipients) {
            recipients = await this.getRecipients(data);
        }
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
            const templateConfig = this.getMessageTemplateConfig();
            const config = ClassHelper.resolveSpawn(templateConfig, this.module);
            const template = this.spawn(config);
            template.data = await template.prepareData(data);
            const sourceSubject = this.get('subject');
            const translatedSubject = this.translate(sourceSubject, messageSource);
            const subject = template.resolveText(translatedSubject);
            this.set('subject', subject);
            const sourceText = this.get('text');
            const translatedText = this.translate(sourceText, messageSource);
            const text = template.resolveText(translatedText);
            this.set('text', text);
        } catch (err) {
            this.log('error', 'Message template failed:', err);
        }
    }

    translate (message, source) {
        return this.module.translate(message, null, source);
    }

    async getRecipients (data) {
        let config = CommonHelper.parseJson(this.get('recipient'));
        if (!config) {
            return null;
        }
        try {
            config = ClassHelper.resolveSpawn(config, this.module);
            const filter = this.spawn(config);
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
                const values = await this.getRecipientUsersByFilter(filter);
                users.push(...values);
            }
        }
        return users;
    }

    async getRecipientUsersByFilter (id) {
        const filter = this.spawn('model/UserFilter');
        const query = filter.findById(id);
        const model = await query.one();
        return model?.getUsers() || [];
    }
};
module.exports.init(module);

const ClassHelper = require('areto/helper/ClassHelper');
const CommonHelper = require('areto/helper/CommonHelper');
const ObjectHelper = require('areto/helper/ObjectHelper');