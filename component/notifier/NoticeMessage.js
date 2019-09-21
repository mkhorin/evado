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
                'header',
                'content',
                'sentAt',
                'createdAt'
            ],
            RULES: [
                [['header', 'content'], 'required'],
                ['sentAt', 'default', {value: null}]
            ],
            UNLINK_ON_REMOVE: [
                'noticeMessageUsers'
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

    findPending () {
        return this.find({sentAt: null}, ['!=', 'notice', null]).order({[this.PK]: 1});
    }

    create (notice) {
        this.set('notice', notice.getId());
        this.set('header', notice.get('header'));
        this.set('content', notice.get('content'));
        this.set('createdAt', new Date);
        return this.save();
    }

    async send () {
        if (this.isSent()) {
            return this.log('error', 'Message already sent');
        }
        const notice = await this.findRelation('notice');
        if (!notice) {
            return this.log('error', 'Notice not found');
        }
        const users = await notice.getUsers();
        await this.spawn('notifier/NoticeMessageUser').addMessage(this.getId(), users);
        await this.directUpdate({sentAt: new Date});
        return true;
    }

    async truncate () {
        const notice = await this.findRelation('notice');
        if (!notice) {
            return this.log('error', 'Notice not found');
        }
        await ModelHelper.truncateOverflow({
            query: this.find({notice: notice.getId()}),
            overflow: notice.getOption('messageOverflow', this.OVERFLOW),
            truncation: notice.getOption('messageTruncation', this.TRUNCATION)
        });
        return true;
    }

    relNotice () {
        const Class = this.getClass('notifier/Notice');
        return this.hasOne(Class, Class.PK, 'notice');
    }

    relNoticeMessageUsers () {
        const Class = this.getClass('notifier/NoticeMessageUser');
        return this.hasMany(Class, 'message', this.PK).removeOnUnlink();
    }
};
module.exports.init(module);

const ModelHelper = require('../helper/ModelHelper');