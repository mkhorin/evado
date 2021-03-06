/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const Base = require('areto/db/ActiveRecord');

module.exports = class NotificationMessage extends Base {

    static getConstants () {
        return {
            TABLE: 'sys_notification_message',
            ATTRS: [
                'notification',
                'subject',
                'text',
                'recipients',
                'sentAt',
                'createdAt'
            ],
            RULES: [
                [['subject', 'text'], 'required'],
                ['sentAt', 'default', {value: null}]
            ],
            DELETE_ON_UNLINK: [
                'popupNotifications'
            ],
            OVERFLOW: 10,
            TRUNCATION: 5
        };
    }

    isSent () {
        return !!this.get('sentAt');
    }

    canSend () {
        return !this.isSent() && this.get('notification');
    }

    getTitle () {
        return this.get('subject');
    }

    findUnsent () {
        return this.find({sentAt: null}, ['!=', 'notification', null]).order({[this.PK]: 1});
    }

    create (notification, recipients) {
        this.set('notification', notification.getId());
        this.set('subject', notification.get('subject'));
        this.set('text', notification.get('text'));
        this.set('createdAt', new Date);
        this.set('recipients', Array.isArray(recipients) ? recipients : recipients ? [recipients] : null);
        return this.save();
    }

    async send () {
        if (this.isSent()) {
            return this.log('error', 'Message already sent');
        }
        const notification = await this.resolveRelation('notification');
        if (!notification) {
            return this.log('error', 'Notification not found');
        }
        const recipients = await this.resolveRecipients();
        if (!recipients.length) {
            return this.log('error', 'No recipients found');
        }
        for (const method of notification.get('methods')) {
            switch (method) {
                case 'popup': await this.sendAsPopup(recipients); break;
                case 'email': await this.sendAsEmail(recipients); break;
            }
        }
        await this.directUpdate({sentAt: new Date});
        return true;
    }

    async resolveRecipients () {
        const recipients = this.get('recipients');
        if (recipients?.length) {
            return recipients;
        }
        const notification = await this.resolveRelation('notification');
        return notification ? await notification.getRecipientUsers() : [];
    }

    sendAsPopup (users) {
        return this.spawn('notifier/PopupNotification').create(this.getId(), users);
    }

    async sendAsEmail (users) {
        const recipient = await this.spawn('model/User').findById(users).column('email');
        const subject = this.get('subject');
        const text = this.get('text');
        return this.module.getMailer().send({recipient, subject, text});
    }

    async truncate () {
        const notification = await this.resolveRelation('notification');
        if (!notification) {
            return this.log('error', 'Notification not found');
        }
        const query = this.find({notification: notification.getId()});
        const overflow = notification.getOption('messageOverflow', this.OVERFLOW);
        const truncation = notification.getOption('messageTruncation', this.TRUNCATION);
        await ModelHelper.truncateOverflow({query, overflow, truncation});
        return true;
    }

    relNotification () {
        const Class = this.getClass('notifier/Notification');
        return this.hasOne(Class, Class.PK, 'notification');
    }

    relPopupNotifications () {
        const Class = this.getClass('notifier/PopupNotification');
        return this.hasMany(Class, 'message', this.PK);
    }
};
module.exports.init(module);

const ModelHelper = require('../helper/ModelHelper');