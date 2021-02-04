/**
 * @copyright Copyright (c) 2020 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const Base = require('areto/base/Component');

module.exports = class Notifier extends Base {

    constructor (config) {
        super({
            tasks: [], // message sending task
            messageSource: 'notification', // message translation source
            ...config
        });
    }

    async execute (name, recipients, data) {
        const notification = await this.findNotificationByName(name).one();
        if (!notification) {
            return this.log('error', `Notification not found: ${name}`);
        }
        await this.createMessage(notification, data, recipients);
        return this.executeTasks();
    }

    async executeByNames (names, data) {
        const models = await this.findNotificationByName(names).all();
        return this.executeNotifications(models, data);
    }

    async executeById (id, data) {
        const models = await this.findNotificationById(id).all();
        return this.executeNotifications(models, data);
    }

    async executeNotifications (notifications, data) {
        for (const notification of notifications) {
            await this.createMessage(notification, data);
        }
        return this.executeTasks();
    }

    executeTasks () {
        return this.module.getScheduler().executeTasks(this.tasks);
    }

    createMessage (notification, data, recipients) {
        return notification.createMessage(data, this.messageSource, recipients);
    }

    findNotificationByName (name) {
        return this.findActiveNotification().and({name});
    }

    findNotificationById (id) {
        return this.findActiveNotification().byId(id);
    }

    findActiveNotification () {
        return this.spawnNotification().find({active: true});
    }

    spawnNotification () {
        return this.spawn('notifier/Notification');
    }
};
module.exports.init(module);