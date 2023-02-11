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

    /**
     * @param {Object} config
     * @param {string} config.defaultSender - Format: "System" <system@system.sys>
     */
    constructor (config) {
        super({
            engine: require('nodemailer'),
            settings: {},
            senderMap: {},
            defaultSender: '',
            defaultMessageSource: 'mail',
            passwordResetUrl: '/auth/reset-password',
            verificationUrl: '/auth/verify',
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
        return Object.prototype.hasOwnProperty.call(this.senderMap, key)
            ? this.senderMap[key]
            : null;
    }

    async prepareData ({sender, recipient, subject, text}) {
        sender = this.prepareSender(sender);
        return {sender, recipient, subject, text};
    }

    prepareSender (sender) {
        return this.getSender(sender) || sender || this.defaultSender;
    }

    beforeSend (data) {
        const event = new Event(data);
        return this.trigger(this.EVENT_BEFORE_SEND, event);
    }

    afterSend (result, data) {
        const event = new Event({result, data});
        return this.trigger(this.EVENT_AFTER_SEND, event);
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
        return this.executeAuthSubmit('passwordReset', this.passwordResetUrl, ...arguments);
    }

    sendVerification () {
        return this.executeAuthSubmit('verification', this.verificationUrl, ...arguments);
    }

    async executeAuthSubmit (name, link, verification, user) {
        try {
            let recipient = user.getEmail();
            let subject = this.translate(`${name}.subject`);
            let time = this.module.params.verificationLifetime;
            time = this.formatter.format(time, 'duration');
            link = this.urlManager.createAbsolute(link);
            link = `${link}?key=${verification.get('key')}`;
            let text = this.translate(`${name}.text`, {name: user.getTitle(), link, time});
            await this.send({recipient, subject, text});
        } catch (error) {
            await verification.delete();
            throw error;
        }
    }
};
module.exports.init();

const Event = require('areto/base/Event');