/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const Base = require('areto/base/Base');

module.exports = class PasswordAuthService extends Base {

    constructor (config) {
        super({
            // email: [email]
            // password: [password]
            // rememberMe: [true]
            // user: [new WebUser]
            rememberPeriod: 7 * 24 * 3600,
            failedMessage: 'Invalid authentication',
            bannedMessage: 'Account is blocked',
            ...config
        });
    }

    async login () {
        const {identity, error} = await this.getIdentity();
        if (error) {
            return error;
        }
        await this.user.login({
            identity,
            duration: this.getRememberPeriod()
        });
    }

    async getIdentity () {
        let error = null;
        let identity = await this.spawn('model/User').findByEmail(this.email).one();
        if (!identity || !identity.checkPassword(this.password)) {
            error = this.failedMessage;
            this.logFail();
        } else if (identity.isBanned()) {
            error = this.bannedMessage;
        }
        return {identity, error};
    }

    getRememberPeriod () {
        return this.rememberMe ? this.rememberPeriod : 0;
    }

    logFail () {
        this.module.log('warn', this.failedMessage, {
            email: this.email,
            ip: this.user.getIp()
        });
    }
};
module.exports.init();