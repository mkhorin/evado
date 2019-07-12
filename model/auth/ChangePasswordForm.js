/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const Base = require('areto/base/Model');

module.exports = class ChangePasswordForm extends Base {

    static getConstants () {
        return {
            RULES: [
                [['currentPassword', 'newPassword', 'newPasswordRepeat', 'captchaCode'], 'required'],
                [['currentPassword', 'newPassword'], 'string', {min: 6, max: 24}],
                [['newPasswordRepeat'], 'compare', {compareAttr: 'newPassword'}],
                [['newPassword'], 'compare', {
                    compareAttr: 'currentPassword',
                    operator: '!=',
                    message: 'Value must not be equal to current password'
                }],
                [['captchaCode'], require('areto/captcha/CaptchaValidator')],
                [['currentPassword'], 'validateCurrentPassword', {skipOnAnyError: true}]
            ],
            ATTR_LABELS: {
                captchaCode: 'Verification code'
            }
        };
    }

    async validateCurrentPassword (attr) {
        if (!this.userModel) {
            this.addError(attr, 'User is not identified');
        } else if (!this.userModel.validatePassword(this.get(attr))) {
            this.addError(attr, 'Current password is invalid');
        }
    }

    async changePassword () {
        if (!await this.validate()) {
            return false;
        }
        this.userModel.setPassword(this.get('newPassword'));
        if (await this.userModel.save()) {
            return true;
        }
        this.addError('newPassword', this.userModel.getFirstError());
        return false;
    }
};
module.exports.init();