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
                ['newPassword', (attr, model)=> {
                    return model.spawn('security/PasswordValidator').validateAttr(attr, model);
                }],
                ['key', 'required', {message: 'Reset key required'}],
                ['captchaCode', require('areto/security/captcha/CaptchaValidator')]                
            ],
            ATTR_LABELS: {
                'captchaCode': 'Verification code'
            }
        };
    }

    async resetPassword () {
        if (!await this.validate()) {
            return false;
        }
        try {
            const service = this.spawn('security/PasswordAuthService');
            const verification = await service.getVerification(this.get('key'));
            const user = await service.getUserByVerification(verification);
            try {
                await service.changePassword(this.get('newPassword'), user);
                await verification.execute();
                await this.user.log('resetPassword', undefined, user);
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