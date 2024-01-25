/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const Base = require('areto/base/Model');

module.exports = class SignUpForm extends Base {

    static getConstants () {
        return {
            RULES: [
                [['name', 'email', 'password', 'passwordRepeat', 'captchaCode'], 'required'],
                ['name', 'validator/UserNameValidator'],
                ['email', 'email'],
                ['password', 'validator/PasswordValidator'],
                ['passwordRepeat', 'compare', {compareAttr: 'password'}],
                ['captchaCode', require('areto/security/captcha/CaptchaValidator')]
            ],
            ATTR_LABELS: {
                captchaCode: 'Verification code'
            }
        };
    }

    async register () {
        if (!await this.validate()) {
            return false;
        }
        try {
            const {enableSignUpVerification} = this.module.params;
            this.set('verified', !enableSignUpVerification);
            const service = this.spawn('security/PasswordAuthService');
            const user = await service.register(this.getAttrMap());
            if (!user.isVerified()) {
                await this.sendVerification(user, service);
            }
            await this.user.log('register', undefined, user);
            return user;
        } catch (err) {
            this.addError('register', err);
        }
    }

    async sendVerification (user, service) {
        const verification = await service.createVerification(user);
        const mailer = this.module.getMailer();
        await mailer.sendVerification(verification, user);
    }
};
module.exports.init(module);