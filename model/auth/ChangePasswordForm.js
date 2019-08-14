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
                [['captchaCode'], require('areto/security/captcha/CaptchaValidator')]
            ],
            ATTR_LABELS: {
                captchaCode: 'Verification code'
            }
        };
    }

    async changePassword () {
        if (!await this.validate()) {
            return false;
        }
        const auth = this.spawn('security/PasswordAuthService', {user: this.user});
        if (!await auth.checkPassword(this.get('currentPassword'))) {
            return this.addError('currentPassword', 'Invalid password');
        }
        const error = await auth.changePassword(this.get('newPassword'));
        if (error) {
            return this.addError('newPassword', error);
        }
        return true;
    }
};
module.exports.init();