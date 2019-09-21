/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const Base = require('areto/base/Base');

module.exports = class PasswordAuthService extends Base {

    constructor (config) {
        super({
            failedMessage: 'Invalid authentication',
            usedBeforeMessage: 'Password has already been used before',
            blockedMessage: 'Account is blocked',
            blockedUntilMessage: 'Account is blocked until {date}',
            ...config
        });
    }

    async isPasswordExpired (user) {
        if (user.get('expiredPassword')) {
            return true;
        }
        const lifetime = this.module.getParam('maxUserPasswordLifetime');
        if (!lifetime) {
            return false;
        }
        const password = await this.spawnPassword().findByUser(user.getId()).one();
        if (password && password.isExpired(lifetime)) {
            return true;
        }
    }

    async getUserByEmail (email) {
        return this.spawnUser().findByEmail(email).one();
    }
    
    async login (email, password, user) {
        const identity = await this.getUserByEmail(email);
        if (!identity) {
            return this.failLogin(email, user);
        }
        const model = await this.spawnPassword().findByUser(identity.getId()).one();
        if (!model || !model.check(password)) {
            return this.failLogin(email, user);
        }
        if (identity.isBlocked()) {
            await this.resolveBlocked(identity);
        }
        return identity;
    }

    async failLogin (email, user) {
        const data = {email, ip: user.getIp()};
        this.module.log('warn', this.failedMessage, data);
        await this.module.catch('auth.fail', data);
        throw this.failedMessage;
    }

    resolveBlocked (model) {
        const date = model.get('unlockAt');
        if (!(date instanceof Date)) {
            throw this.blockedMessage;
        }
        if (date >= new Date) {
            throw [this.blockedUntilMessage, 'app', {date: [date, 'timestamp']}];
        }
        return model.unlock();
    }

    async register (data) {
        const identity = this.spawnUser();
        identity.assignAttrs(data);
        if (!await identity.validate()) {
            throw identity.getFirstError();
        }
        const password = this.spawnPassword();
        password.assignAttrs(data);
        if (!await password.validate()) {
            throw identity.getFirstError();
        }
        await identity.forceSave();
        password.set('user', identity.getId());
        await password.forceSave();
        return identity;
    }

    async changePassword (newPassword, user, expired = false) {
        const model = this.spawnPassword();
        model.set('user', user.getId());
        const passwords = await model.findByUser(user.getId()).all();
        if (!passwords.length) {
            return this.executeUpdate(newPassword, model, user, expired); // insert new
        }
        const old = this.module.getParam('oldUserPasswords', 0);
        if (model.constructor.isUsed(newPassword, passwords.slice(0, old + 1))) {
            throw this.usedBeforeMessage;
        }
        const current = passwords[0];
        const min = this.module.getParam('minUserPasswordLifetime');
        if (!old || !min || !current.isExpired(min)) {
            return this.executeUpdate(newPassword, current, user, expired); // update current
        }
        await model.constructor.remove(passwords.slice(old));
        return this.executeUpdate(newPassword, model, user, expired); // append new
    }

    async executeUpdate (newPassword, model, user, expiredPassword) {
        model.set('password', newPassword);
        if (!await model.save()) {
            throw model.getFirstError();
        }
        await user.directUpdate({expiredPassword});
    }

    async createVerification (user) {
        const verification = this.spawnVerification();
        let model = await verification.findByUser(user.getId()).one();
        if (model) {
            const timeout = this.module.getParam('repeatVerificationTimeout');
            const rest = DateHelper.parseDuration(timeout) - model.getElapsedTime();
            if (rest > 0) {
                throw ['Try again {time}', 'app', {time: [rest, 'duration', {suffix: true}]}];
            }
        } else {
            model = verification;
        }
        model.setNewKey(user.getId());
        if (!await model.save()) {
            throw model.getFirstError();
        }
        return model;
    }

    async getUserByVerification (model) {
        const id = model.get('user');
        const user = await this.spawnUser().findById(id).one();
        if (!user) {
            throw 'User not found';
        }
        return user;
    }

    async getVerification (key) {
        const model = await this.spawnVerification().find({key}).one();
        if (!model) {
            throw 'Verification not found';
        }
        if (model.isDone()) {
            throw 'Verification already done';
        }
        if (model.isExpired(this.module.getParam('verificationLifetime'))) {
            throw 'Verification expired';
        }
        return model;
    }

    async verify (key) {
        const verification = await this.getVerification(key);
        const user = await this.getUserByVerification(verification);
        await verification.execute();
        await user.verify();
        return user;
    }

    spawnPassword () {
        return this.spawn('security/UserPassword', ...arguments);
    }

    spawnUser () {
        return this.spawn('model/User', ...arguments);
    }

    spawnVerification () {
        return this.spawn('security/Verification', ...arguments);
    }
};
module.exports.init();

const DateHelper = require('areto/helper/DateHelper');