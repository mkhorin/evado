/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const Base = require('areto/base/Component');

module.exports = class Mailer extends Base {

    static getConstants () {
        return {
            EVENT_BEFORE_SEND: 'beforeSend',
            EVENT_AFTER_SEND: 'afterSend'
        };
    }

    constructor (config) {
        super({
            engine: require('nodemailer'),
            settings: {},
            senderMap: {},
            defaultSender: '', //'"System" <system@system.sys>'
            defaultMessageSource: 'mail',
            ...config
        });
    }

    async init () {
        this._transport = this.engine.createTransport(this.settings);
    }

    getSender (key) {
        return this.senderMap.hasOwnProperty(key) ? this.senderMap : null;
    }

    async send (data) {
        data = await this.prepareData(data);
        await this.beforeSend(data);
        const result = await this.forceSend(data);
        await this.afterSend(result, data);
    }

    async prepareData ({sender, recipient, subject, text}) {
        sender = this.prepareSender(sender);
        return {sender, recipient, subject, text};
    }

    prepareSender (sender) {
        return this.getSender(sender) || sender || this.defaultSender;
    }

    beforeSend (data) {
        return this.trigger(this.EVENT_BEFORE_SEND, new Event(data));
    }

    afterSend (result, data) {
        return this.trigger(this.EVENT_AFTER_SEND, new Event({result, data}));
    }

    async forceSend (data) {
        try {
            const result = await this._transport.sendMail({
                from: data.sender,
                to: data.recipient.toString(),
                subject: data.subject,
                text: data.text,
            });
            this.log('info', `Message sent: ${result.messageId}`);
            return result;
        } catch (err) {
            this.log('error', 'Sending failed', err);
            throw Error('Sending failed');
        }
    }
};
module.exports.init();

const Event = require('areto/base/Event');