/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const Base = require('areto/base/Base');

module.exports = class SecurityConsole extends Base {

    constructor () {
        super(...arguments);
        this.params = Object.assign(this.getDefaultParams(), this.params);
    }

    getDefaultParams () {
        return {};
    }

    getRbac () {
        return this.app.getRbac();
    }

    getStore () {
        return this.getRbac().store;
    }

    getKey () {
        return this.getStore().key;
    }

    getUserItems () {
        return this.app.getConfig('users') || [];
    }

    findUserByParams () {
        return this.spawnUser().findSame(this.params.name, this.params.email);
    }

    spawnUser () {
        return this.spawn('model/User', ...arguments);
    }

    async clear () {
        if (this.params.clearUsers) {
            await this.clearUsers();
        }
        this.log('info', 'Clearing security...');
        await this.getStore().clearAll();
        this.log('info', 'Security cleared');
    }

    async clearUsers () {
        this.log('info', 'Deleting users...');
        const user = this.spawnUser();
        await user.getDb().truncate(user.getTable());
        const password = this.spawn('security/UserPassword');
        await password.getDb().truncate(password.getTable());
        this.log('info', 'Users deleted');
    }

    async createUsers () {
        this.log('info', 'Creating users...');
        for (const data of this.getUserItems()) {
            await this.createUser(data);
        }
        this.log('info', 'Users ready');
    }

    async createUser (data = this.params) {
        try {
            const service = this.spawn('security/PasswordAuthService');
            const user = await service.register(data, true);
            this.log('info', 'User created', data.email);
            return user;
        } catch (err) {
            this.log('error', 'User creation failed', err);
        }
    }

    async updateUser (data = this.params) {
        const user = await this.findUserByParams().one();
        if (!user) {
            return this.log('error', 'User not found');
        }
        user.set(data.attr, data.value);
        await user.save()
            ? this.log('info', 'User updated', data.email)
            : this.log('error', 'User update failed', user.getFirstErrorMap());
    }

    async changePassword () {
        const user = await this.findUserByParams().one();
        if (!user) {
            return this.log('error', `User not found`);
        }
        try {
            const service = this.spawn('security/PasswordAuthService');
            await service.changePassword(this.params.password, user);
            this.log('info', `Password changed`);
            return true;
        } catch (err) {
            this.log('error', 'Password change failed', err);
        }
    }

    async createSecurity () {
        this.log('info', 'Creating security...');
        await this.getRbac().load();
        const data = this.app.getConfig('security');
        this.normalizeConfigData(data.rules);
        this.normalizeConfigData(data.assignmentRules);
        await this.getRbac().createByData(data);
        this.log('info', 'Security ready');
    }

    normalizeConfigData (data) {
        if (data) {
            for (const item of Object.values(data)) {
                item.config = this.owner.stringifyData(item.config);
            }
        }
    }

    async assignRole () {
        const user = await this.findUserByParams().one();
        return user
            ? this.getStore().createAssignment(this.params.role, user.getId())
            : this.log('error', 'User not found');
    }

    log () {
        this.owner.log(...arguments);
    }
};