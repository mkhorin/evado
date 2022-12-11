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
        const {message} = this.controller.getQueryParams();
        return message
            ? this.readMessage(message)
            : this.getUnreadMessages();
    }

    async render () {
        const query = this.user.findUnreadMessages();
        const counter = await query.count();
        return this.renderTemplate('_widget/notifications', {counter});
    }

    async readMessage (id) {
        const query = this.spawnMessage().findById(id);
        const model = await query.one();
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
        const query = this.user.findUnreadMessages();
        const ids = await query.column('message');
        const counter = ids.length;
        const items = counter ? await this.getUnreadMessageItems(ids) : [];
        return {counter, items};
    }

    async getUnreadMessageItems (ids) {
        const message = this.spawnMessage();
        const order = {[message.PK]: -1};
        const query = message.findById(ids).order(order).limit(this.unreadLimit);
        const models = await query.all();
        return models.map(this.getUnreadMessageItem, this);
    }

    getUnreadMessageItem (model) {
        return {
            id: model.getId(),
            title: model.get('subject')
        };
    }

    spawnMessage () {
        return this.spawn('notifier/NotificationMessage');
    }
};

const BadRequest = require('areto/error/http/BadRequest');