/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const Base = require('areto/base/Model');

module.exports = class RequestVerificationForm extends Base {

    static getConstants () {
        return {
            RULES: [
                [['email', 'captchaCode'], 'required'],
                ['email', 'email'],
                [['captchaCode'], require('areto/security/captcha/CaptchaValidator')]
            ],
            ATTR_LABELS: {
                captchaCode: 'Verification code'
            }
        };
    }

    async request () {
        if (!await this.validate()) {
            return false;
        }
        try {
            const service = this.spawn('security/PasswordAuthService');
            const user = await this.getUser(service);
            const verification = await service.createVerification(user);
            await this.send(user, verification);
            await this.user.log('request-verification', undefined, user);
            return true;
        } catch (err) {
            this.addError('email', err);
        }
    }

    async getUser (service) {
        const user = await service.getUserByEmail(this.get('email'));
        if (!user) {
            throw 'User not found';
        }
        if (user.isVerified()) {
            throw 'User is already verified';
        }
        return user;
    }

    send (user, verification) {
        const url = this.module.get('url').createAbsolute('/admin/verify');
        const lifetime = this.module.getParam('verificationLifetime');
        return this.module.getMailer().send({
            recipient: user.getEmail(),
            subject: this.module.translate('verification.subject', 'mail'),
            text: this.module.translate('verification.text', 'mail', {
                name: user.getTitle(),
                link: `${url}?key=${verification.get('key')}`,
                time: this.module.get('formatter').format(lifetime, 'duration')
            })
        });
    }
};
module.exports.init();