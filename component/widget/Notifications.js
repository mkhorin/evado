/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const Base = require('areto/view/Widget');

module.exports = class Notifications extends Base {

    constructor (config) {
        super({
            unreadLimit: 5,
            ...config
        });
    }

    execute () {
        this.user = this.controller.user.identity;
        if (!this.user) {
            return '';
        }
        if (!this.widgetAction) {
            return this.render();
        }
        const id = this.controller.getQueryParam('message');
        return id ? this.readMessage(id) : this.getUnreadMessages();
    }

    async render () {
        const counter = await this.user.findUnreadMessages().count();
        return this.renderTemplate('_widget/notifications', {counter});
    }

    async readMessage (id) {
        const model = await this.spawn('notifier/NotificationMessage').findById(id).one();
        if (!model) {
            throw new BadRequest('Message not found');
        }
        await this.user.readMessage(id);
        const data = await this.getUnreadMessages();
        data.message = {
            subject: model.get('subject'),
            text: model.get('text'),
            sentAt: model.get('sentAt')
        };
        return data;
    }

    async getUnreadMessages () {
        const ids = await this.user.findUnreadMessages().column('message');
        const counter = ids.length;
        const items = counter ? await this.getUnreadMessageItems(ids) : [];
        return {counter, items};
    }

    async getUnreadMessageItems (ids) {
        const message = this.spawn('notifier/NotificationMessage');
        const models = await message.findById(ids).order({[message.PK]: -1}).limit(this.unreadLimit).all();
        return models.map(this.getUnreadMessageItem, this);
    }

    getUnreadMessageItem (model) {
        return {
            id: model.getId(),
            title: model.get('subject')
        };
    }
};

const BadRequest = require('areto/error/http/BadRequest');