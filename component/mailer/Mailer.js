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
        this.formatter = this.module.get('formatter');
        this.urlManager = this.module.get('urlManager');
        this.transport = await this.createTransport();
    }

    createTransport () {
        return this.engine.createTransport(this.settings);
    }

    async send (data) {
        data = await this.prepareData(data);
        await this.beforeSend(data);
        const result = await this.directSend(data);
        await this.afterSend(result, data);
    }

    getSender (key) {
        return this.senderMap.hasOwnProperty(key) ? this.senderMap : null;
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

    async directSend (data) {
        try {
            const result = await this.transport.sendMail({
                from: data.sender,
                to: data.recipient,
                subject: data.subject,
                text: data.text,
            });
            this.log('info', `Message sent: ${result.messageId}`);
            return result;
        } catch (err) {
            this.log('error', 'Sending failed', err);
            throw 'Sending failed';
        }
    }

    translate (message, params, source = this.defaultMessageSource) {
        return this.module.translate(message, params, source);
    }

    sendPasswordReset () {
        return this.executeVerificationSubmit('passwordReset', '/auth/reset-password', ...arguments);
    }

    sendVerification () {
        return this.executeVerificationSubmit('verification', '/auth/verify', ...arguments);
    }

    async executeVerificationSubmit (name, link, verification, user) {
        try {
            let time = this.module.getParam('verificationLifetime');
            time = this.formatter.format(time, 'duration');
            link = this.urlManager.createAbsolute(link);
            link = `${link}?key=${verification.get('key')}`;
            await this.send({
                recipient: user.getEmail(),
                subject: this.translate(`${name}.subject`),
                text: this.translate(`${name}.text`, {name: user.getTitle(), link, time})
            });
        } catch (err) {
            await verification.delete();
            throw err;
        }
    }
};
module.exports.init();

const Event = require('areto/base/Event');