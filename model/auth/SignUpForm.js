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
                ['name', 'string', {min: 2, max: 24}],
                ['name', 'regex', {pattern: /^[а-яa-z\s-]+$/i}],
                ['email', 'email'],
                ['password', this.validatePassword.bind(this)],
                ['passwordRepeat', 'compare', {compareAttr: 'password'}],
                ['captchaCode', require('areto/security/captcha/CaptchaValidator')]
            ],
            ATTR_LABELS: {
                captchaCode: 'Verification code'
            }
        };
    }

    static validatePassword (attr, model) {
        return model.spawn('security/PasswordValidator').validateAttr(attr, model);
    }

    async register () {
        if (!await this.validate()) {
            return false;
        }        
        try {
            this.set('verified', !this.module.getParam('enableSignUpVerification'));
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