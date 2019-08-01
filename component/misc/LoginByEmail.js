/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const Base = require('areto/base/Base');

module.exports = class LoginByEmail extends Base {

    constructor (config) {
        super({
            // email: [email]
            // password: [password]
            // rememberMe: [true]
            // user: [new WebUser]
            rememberPeriod: 7 * 24 * 3600,
            failedMessage: 'Invalid authentication',
            bannedMessage: 'This account is banned',
            User,
            ...config
        });
    }

    async login () {
        await this.getIdentity();
        if (!this._error) {
            await this.user.login(this._identity, this.getRememberPeriod());
        }
        return {
            error: this._error,
            identity: this._identity
        };
    }

    async getIdentity () {
        this._identity = null;
        const model = await this.spawn(User).findByEmail(this.email).one();
        if (!model || !model.validatePassword(this.password)) {
            this.module.log('warn', this.failedMessage, {
                email: this.email,
                ip: this.user.getIp()
            });
            this._error = this.failedMessage;
        } else if (model.isBanned()) {
            this._error = this.bannedMessage;
        }
        return this._identity = model;
    }

    getRememberPeriod () {
        return this.rememberMe ? this.rememberPeriod : 0;
    }
};
module.exports.init();

const User = require('../../model/User');