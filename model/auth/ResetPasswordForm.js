/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const Base = require('areto/base/Model');

module.exports = class ResetPasswordForm extends Base {

    static getConstants () {
        return {
            RULES: [
                [['newPassword', 'newPasswordRepeat', 'captchaCode'], 'required'],
                ['newPasswordRepeat', 'compare', {compareAttr: 'newPassword'}],
                ['newPassword', 'validator/PasswordValidator'],
                ['key', 'required', {message: 'Reset key required'}],
                ['captchaCode', require('areto/security/captcha/CaptchaValidator')]
            ],
            ATTR_LABELS: {
                captchaCode: 'Verification code'
            }
        };
    }

    async resetPassword () {
        if (!await this.validate()) {
            return false;
        }
        try {
            const service = this.spawn('security/PasswordAuthService');
            const key = this.get('key');
            const verification = await service.getVerification(key);
            const user = await service.getUserByVerification(verification);
            try {
                const newPassword = this.get('newPassword');
                const hash = await service.changePassword(newPassword, user);
                await verification.execute();
                await this.user.log('resetPassword', hash, user);
                return true;
            } catch (err) {
                this.addError('newPassword', err);
            }
        } catch (err) {
            this.addError('key', err);
        }
    }
};
module.exports.init();