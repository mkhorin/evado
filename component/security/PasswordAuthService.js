/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const Base = require('areto/base/Base');

module.exports = class PasswordAuthService extends Base {

    async isPasswordExpired (user) {
        if (user.get('expiredPassword')) {
            return true;
        }
        const lifetime = this.module.params.maxUserPasswordLifetime;
        if (!lifetime) {
            return false;
        }
        const password = await this.spawnPassword().findByUser(user.getId()).one();
        if (password?.isExpired(lifetime)) {
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
        this.module.log('warn', 'Authentication failed', data);
        await this.module.emit('auth.fail', data);
        throw 'auth.invalidAuth';
    }

    resolveBlocked (model) {
        const date = model.get('unlockAt');
        if (!(date instanceof Date)) {
            throw 'auth.userBlocked';
        }
        if (date >= new Date) {
            throw ['auth.userBlockedUntil', {date: [date, 'timestamp']}];
        }
        return model.unlock();
    }

    async register (data, silent) {
        const user = this.spawnUser();
        if (data[user.PK]) {
            data[user.PK] = user.getDb().normalizeId(data[user.PK]);
        }
        user.assign(data);
        if (!await user.validate()) {
            throw user.getFirstError();
        }
        const password = this.spawnPassword();
        password.assign({
            hash: data.passwordHash,
            password: data.password
        });
        if (!await password.validate()) {
            throw user.getFirstError();
        }
        await user.forceSave();
        password.set('user', user.getId());
        await password.forceSave();
        if (!silent) {
            await this.module.emit('auth.register', {user});
        }
        return user;
    }

    async changePassword (newPassword, user, expired = false) {
        const model = this.spawnPassword();
        model.set('user', user.getId());
        const passwords = await model.findByUser(user.getId()).all();
        if (!passwords.length) { // insert new
            return this.executeUpdate(newPassword, model, user, expired);
        }
        const old = this.module.params.oldUserPasswords || 0;
        if (model.constructor.isUsed(newPassword, passwords.slice(0, old + 1))) {
            throw 'auth.passwordAlreadyUsed';
        }
        const current = passwords[0];
        const currentHash = current.get('hash');
        const min = this.module.params.minUserPasswordLifetime;
        if (!old || !min || !current.isExpired(min)) {
            await this.executeUpdate(newPassword, current, user, expired); // update current
            return currentHash;
        }
        await model.constructor.delete(passwords.slice(old));
        await this.executeUpdate(newPassword, model, user, expired); // append new
        return currentHash;
    }

    async executeUpdate (newPassword, model, user, expiredPassword) {
        model.set('password', newPassword);
        if (!await model.save()) {
            throw model.getFirstError();
        }
        await user.directUpdate({expiredPassword});
        await this.module.emit('auth.changePassword', {user, model});
    }

    async createVerification (user) {
        const model = this.spawnVerification();
        let verification = await model.findByUser(user.getId()).one();
        if (verification) {
            const timeout = this.module.params.repeatVerificationTimeout;
            const rest = DateHelper.parseDuration(timeout) - verification.getElapsedTime();
            if (rest > 0) {
                throw ['auth.requestAlreadySent', {time: [rest, 'duration', {suffix: true}]}];
            }
        } else {
            verification = model;
        }
        verification.setNewKey(user.getId());
        if (!await verification.save()) {
            throw verification.getFirstError();
        }
        await this.module.emit('auth.createVerification', {user, verification});
        return verification;
    }

    async getUserByVerification (model) {
        const id = model.get('user');
        const user = await this.spawnUser().findById(id).one();
        if (!user) {
            throw 'auth.userNotFound';
        }
        return user;
    }

    async getVerification (key) {
        const model = await this.spawnVerification().find({key}).one();
        if (!model) {
            throw 'auth.verificationNotFound';
        }
        if (model.isDone()) {
            throw 'auth.verificationAlreadyDone';
        }
        if (model.isExpired(this.module.params.verificationLifetime)) {
            throw 'auth.verificationExpired';
        }
        return model;
    }

    async verify (key) {
        const verification = await this.getVerification(key);
        const user = await this.getUserByVerification(verification);
        await verification.execute();
        await user.verify();
        await this.module.emit('auth.verify', {user, verification});
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