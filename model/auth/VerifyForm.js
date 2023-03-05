/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const Base = require('areto/base/Model');

module.exports = class VerifyForm extends Base {

    static getConstants () {
        return {
            RULES: [
                ['key', 'required', {message: 'Verification key required'}]
            ]
        };
    }

    async verify () {
        if (!await this.validate()) {
            return false;
        }
        try {
            const service = this.spawn('security/PasswordAuthService');
            const key = this.get('key');
            const user = await service.verify(key);
            await this.user.log('verify', undefined, user);
            return true;
        } catch (err) {
            this.addError('key', err);
        }
    }
};
module.exports.init();