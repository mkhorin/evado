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
            this.set('verified', !this.module.params.enableSignUpVerification);
            const service = this.spawn('security/PasswordAuthService');
            const user = await service.register(this.getAttrMap());
            if (!user.isVerified()) {
                const verification = await service.createVerification(user);
                await this.module.getMailer().sendVerification(verification, user);
            }
            await this.user.log('register', undefined, user);
            return user;
        } catch (err) {
            this.addError('register', err);
        }
    }
};
module.exports.init(module);