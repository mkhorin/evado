/**
 * @copyright Copyright (c) 2020 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const Base = require('areto/base/Component');

module.exports = class Notifier extends Base {

    /**
     * @param {Object} config
     * @param {string[]} config.tasks - Message sending tasks
     * @param {string} config.messageSource - Message translation source
     */
    constructor (config) {
        super({
            tasks: [],
            messageSource: 'notification',
            ...config
        });
    }

    async execute (name, recipients, data) {
        const query = this.findNotificationByName(name);
        const notification = await query.one();
        if (!notification) {
            return this.log('error', `Notification not found: ${name}`);
        }
        await this.createMessage(notification, data, recipients);
        return this.executeTasks();
    }

    async executeByNames (names, data) {
        const query = this.findNotificationByName(names);
        const models = await query.all();
        return this.executeNotifications(models, data);
    }

    async executeById (id, data) {
        const query = this.findNotificationById(id);
        const models = await query.all();
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