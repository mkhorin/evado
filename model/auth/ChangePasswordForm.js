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
                [['newPasswordRepeat'], 'compare', {compareAttr: 'newPassword'}],
                [['newPassword'], 'compare', {
                    compareAttr: 'currentPassword',
                    operator: '!=',
                    message: 'Password must not be equal to the current'
                }],
                [['currentPassword', 'newPassword'], 'validator/PasswordValidator'],
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
        const current = this.get('currentPassword');
        const service = this.spawn('security/PasswordAuthService');
        const password = await service.spawnPassword().findByUser(this.user.getId()).one();
        if (!password || !password.check(current)) {
            return this.addError('currentPassword', 'Invalid password');
        }
        try {
            const user = this.user.getIdentity();
            const old = await service.changePassword(this.get('newPassword'), user);
            await this.user.log('changePassword', old, user);
            return true;            
        } catch (err) {
            this.addError('newPassword', err);
        }       
    }
};
module.exports.init();