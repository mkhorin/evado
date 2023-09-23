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
            TRUNCATION_THRESHOLD: 10,
            TRUNCATION_OFFSET: 5
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
        const hasNotification = ['!=', 'notification', null];
        const unsent = {sentAt: null};
        return this.find(unsent, hasNotification).order({[this.PK]: 1});
    }

    create (notification, recipients) {
        this.set('notification', notification.getId());
        this.set('subject', notification.get('subject'));
        this.set('text', notification.get('text'));
        this.set('createdAt', new Date);
        if (!Array.isArray(recipients)) {
            recipients = recipients ? [recipients] : null;
        }
        this.set('recipients', recipients);
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
        const methods = notification.get('methods');
        for (const method of methods) {
            await this.sendByMethod(method, recipients);
        }
        await this.directUpdate({sentAt: new Date});
        return true;
    }

    async sendByMethod (method, recipients) {
        switch (method) {
            case 'popup': {
                await this.sendAsPopup(recipients);
                break;
            }
            case 'email': {
                await this.sendAsEmail(recipients);
                break;
            }
            default: {
                this.log('error', `Sending method is not defined: ${method}`);
            }
        }
    }

    async resolveRecipients () {
        const recipients = this.get('recipients');
        if (recipients?.length) {
            return recipients;
        }
        const notification = await this.resolveRelation('notification');
        return notification
            ? await notification.getRecipientUsers()
            : [];
    }

    sendAsPopup (users) {
        const popup = this.spawn('notifier/PopupNotification');
        return popup.create(this.getId(), users);
    }

    async sendAsEmail (users) {
        const query = this.spawn('model/User').findById(users);
        const recipient = await query.column('email');
        const subject = this.get('subject');
        const text = this.get('text');
        const mailer = this.getSendingMailer();
        return mailer.send({recipient, subject, text});
    }

    getSendingMailer () {
        return this.module.getMailer();
    }

    async truncate () {
        const notification = await this.resolveRelation('notification');
        if (!notification) {
            return this.log('error', 'Notification not found');
        }
        const query = this.find({
            notification: notification.getId()
        });
        const threshold = notification.getOption('messageTruncationThreshold', this.TRUNCATION_THRESHOLD);
        const offset = notification.getOption('messageTruncationOffset', this.TRUNCATION_OFFSET);
        await ModelHelper.truncateOverflow({query, threshold, offset});
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