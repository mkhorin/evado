/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const Base = require('areto/base/Model');

module.exports = class RequestResetForm extends Base {

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
            await this.module.getMailer().sendPasswordReset(verification, user);
            await this.user.log('request-reset', undefined, user);
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
        return user;
    }
};
module.exports.init();