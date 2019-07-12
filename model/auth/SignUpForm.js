/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const Base = require('areto/base/Model');
const User = require('../User');

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
                ['captchaCode', require('areto/captcha/CaptchaValidator')]
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
        let model = this.spawn(User, {scenario: 'create'});
        model.setAttrs(this);
        if (await model.save()) {
            await this.user.login(model, 0);
            return true;
        }
        this.addError('name', model.getFirstError());
        return false;
    }
};
module.exports.init();