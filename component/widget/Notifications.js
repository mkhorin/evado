/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const Base = require('areto/view/Widget');

module.exports = class Notifications extends Base {

    run () {
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
        const model = await this.spawn('notifier/NoticeMessage').findById(id).one();
        if (!model) {
            throw new BadRequest('Message not found');
        }
        await this.user.readMessage(id);
        const data = await this.getUnreadMessages();
        data.message = {
          header: model.get('header'),
          content: model.get('content'),
          sentAt: model.get('sentAt')
        };
        return data;
    }

    async getUnreadMessages () {
        const items = [];
        const ids = await this.user.findUnreadMessages().column('message');
        if (ids.length > 0) {
            const message = this.spawn('notifier/NoticeMessage');
            const models = await message.findById(ids).order({[message.PK]: -1}).limit(5).all();
            for (const model of models) {
                items.push({
                    id: model.getId(),
                    title: model.get('header')
                });
            }
        }
        return {counter: ids.length, items};
    }

};

const BadRequest = require('areto/error/BadRequestHttpException');