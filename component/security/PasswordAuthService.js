/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const Base = require('areto/base/Base');

module.exports = class PasswordAuthService extends Base {

    constructor (config) {
        super({
            // user: [new WebUser]
            rememberPeriod: 7 * 24 * 3600,
            failedMessage: 'Invalid authentication',
            blockedMessage: 'Account is blocked',
            loginAfterRegister: false,
            ...config
        });
    }

    async login (data) {
        const {identity, error} = await this.getIdentity(data);
        if (error) {
            return error;
        }
        const duration = data.rememberMe ? this.rememberPeriod : 0;
        return this.user.login({identity, duration});
    }

    async getIdentity ({email, password}) {
        let error = null;
        const identity = await this.spawn(this.user.auth.Identity).findByEmail(email).one();
        if (!identity || !identity.checkPassword(password)) {
            error = this.failedMessage;
            const data = {email, ip: this.user.getIp()};
            this.module.log('warn', this.failedMessage, data);
            await this.module.catch('auth.fail', data);
        } else if (identity.isBlocked()) {
            error = await this.resolveBlocked(identity);
        }
        return {identity, error};
    }

    async resolveBlocked (model) {
        const until = model.get('unlockAt');
        if (until instanceof Date && until < new Date) {
            await model.directUpdate({status: model.STATUS_ACTIVE});
            return null;
        }
        return this.blockedMessage;
    }

    async checkPassword (password) {
        const identity = this.user.getIdentity();
        return identity && await identity.checkPassword(password);
    }

    async changePassword (newPassword) {
        const identity = this.user.getIdentity();
        if (!identity) {
            return 'Invalid user identity';
        }
        identity.set('password', newPassword);
        if (!await identity.save()) {
            return identity.getFirstError();
        }
    }

    async register (data) {
        const identity = await this.spawn(this.user.auth.Identity, {scenario: 'create'});
        identity.setAttrs(data);
        if (!await identity.save()) {
            return identity.getErrors();
        }
        if (this.loginAfterRegister) {
            return this.user.login({identity, duration: 0});
        }
    }
};
module.exports.init();