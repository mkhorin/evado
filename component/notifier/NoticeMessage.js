/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const Base = require('areto/db/ActiveRecord');

module.exports = class NoticeMessage extends Base {

    static getConstants () {
        return {
            TABLE: 'sys_noticeMessage',
            ATTRS: [
                'notice',
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
        return !this.isSent() && this.get('notice');
    }

    getTitle () {
        return this.get('subject');
    }

    findUnsent () {
        return this.find({sentAt: null}, ['!=', 'notice', null]).order({[this.PK]: 1});
    }

    create (notice, recipients) {
        this.set('notice', notice.getId());
        this.set('subject', notice.get('subject'));
        this.set('text', notice.get('text'));
        this.set('createdAt', new Date);
        this.set('recipients', Array.isArray(recipients) ? recipients : recipients ? [recipients] : null);
        return this.save();
    }

    async send () {
        if (this.isSent()) {
            return this.log('error', 'Message already sent');
        }
        const notice = await this.resolveRelation('notice');
        if (!notice) {
            return this.log('error', 'Notice not found');
        }
        const recipients = await this.resolveRecipients();
        if (!recipients.length) {
            return this.log('warn', 'No recipients found');
        }
        for (const method of notice.get('methods')) {
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
        if (Array.isArray(recipients) && recipients.length) {
            return recipients;
        }
        const notice = await this.resolveRelation('notice');
        return notice ? await notice.getRecipientUsers() : [];
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
        const notice = await this.resolveRelation('notice');
        if (!notice) {
            return this.log('error', 'Notice not found');
        }
        const query = this.find({notice: notice.getId()});
        const overflow = notice.getOption('messageOverflow', this.OVERFLOW);
        const truncation = notice.getOption('messageTruncation', this.TRUNCATION);
        await ModelHelper.truncateOverflow({query, overflow, truncation});
        return true;
    }

    relNotice () {
        const Class = this.getClass('notifier/Notice');
        return this.hasOne(Class, Class.PK, 'notice');
    }

    relPopupNotifications () {
        const Class = this.getClass('notifier/PopupNotification');
        return this.hasMany(Class, 'message', this.PK);
    }
};
module.exports.init(module);

const ModelHelper = require('../helper/ModelHelper');