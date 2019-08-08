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
                ['name', 'string', {min: 3, max: 24}],
                ['name', 'regexp', {pattern: /^[а-яa-z\s-]+$/i}],
                ['email', 'email'],
                ['password', 'string', {min: 6, max: 24}],
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
        const model = this.spawn('model/User', {scenario: 'create'});
        model.setAttrs(this);
        if (!await model.save()) {
            return this.addError('name', model.getFirstError());
        }
        await this.user.login({
            identity: model,
            duration: 0
        });
        return true;
    }
};
module.exports.init(module);