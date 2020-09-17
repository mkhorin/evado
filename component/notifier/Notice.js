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
                'options',
                'recipient',
                'template'
            ],
            RULES: [
                [['name', 'subject', 'text', 'methods'], 'required'],
                ['name', 'regex', {pattern: /^[0-9a-zA-Z-]+$/}],
                ['name', 'unique'],
                ['methods', 'filter', {filter: 'split'}],
                [['options', 'recipient', 'template'], 'json'],
                ['template', 'spawn', {BaseClass: require('./MessageTemplate')}],
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
        return ObjectHelper.getValue(key, this.getOptions(), defaults);
    }

    getOptions () {
        return CommonHelper.parseJson(this.get('options'));
    }

    relNoticeMessages () {
        const Class = this.getClass('notifier/NoticeMessage');
        return this.hasMany(Class, 'notice', this.PK);
    }

    async createMessage (data, messageSource, recipients) {
        await this.resolveTemplate(data, messageSource);
        recipients = recipients || await this.getMessageRecipients(data);
        const message = this.spawn('notifier/NoticeMessage');
        if (await message.create(this, recipients)) {
            return message;
        }
        const error = 'Message creation failed';
        this.addError('error', error);
        this.log('error', `${error}:`, message.getErrors());
    }

    getTemplateConfig () {
        return CommonHelper.parseJson(this.get('template')) || this.getClass('notifier/MessageTemplate');
    }

    async resolveTemplate (data, messageSource) {
        try {
            const template = this.spawn(ClassHelper.resolveSpawn(this.getTemplateConfig(), this.module));
            template.data = await template.prepareData(data);
            this.resolveTemplateAttr('subject', template, messageSource);
            this.resolveTemplateAttr('text', template, messageSource);
        } catch (err) {
            this.log('error', 'Message template failed:', err);
        }
    }

    resolveTemplateAttr (name, template, messageSource) {
        this.set(name, template.resolveSubject(this.translate(this.get(name), messageSource)));
    }

    translate (message, source) {
        return this.module.translate(message, null, source);
    }

    async getMessageRecipients (data) { // on message creating
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

    async getRecipientUsers () { // on message sending
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