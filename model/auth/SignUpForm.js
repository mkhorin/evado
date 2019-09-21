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
                ['name', 'regexp', {pattern: /^[а-яa-z\s-]+$/i}],
                ['email', 'email'],
                ['password', (attr, model)=> model.spawn('security/PasswordValidator').validateAttr(attr, model)],
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
            const service = this.spawn('security/PasswordAuthService');
            const identity = await service.register(this.getAttrMap());
            /*if (this.loginAfterRegister) {
                await this.user.login({identity, duration: 0});
            }//*/
            return true;
        } catch (err) {
            this.addErrors(err);
        }
    }
};
module.exports.init(module);