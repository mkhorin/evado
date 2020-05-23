/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const Base = require('areto/base/Base');

module.exports = class SecurityConsole extends Base {

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
        this.log('info', 'Clear security...');
        await this.getStore().clearAll();
        this.log('info', 'Security cleared');
    }

    async clearUsers () {
        this.log('info', 'Delete users...');
        const user = this.spawnUser();
        await user.getDb().truncate(user.getTable());
        const password = this.spawn('security/UserPassword');
        await password.getDb().truncate(password.getTable());
        this.log('info', 'Users deleted');
    }

    async createUsers () {
        this.log('info', 'Create users...');
        for (const data of this.getUserItems()) {
            await this.createUser(data);
        }
        this.log('info', 'Users ready');
    }

    async createUser (data = this.params) {
        try {
            const service = this.spawn('security/PasswordAuthService');
            const user = await service.register(data);
            this.log('info', `User created: ${data.email}`);
            return user;
        } catch (err) {
            this.log('error', err);
        }
    }

    async createSecurity () {
        this.log('info', 'Create security...');
        await this.getRbac().load();
        const data = this.app.getConfig('security');
        await this.getRbac().createByData(data);
        this.log('info', 'Security ready');
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
            this.log('error', error);
        }
    }

    async assignRole () {
        const user = await this.findUserByParams().one();
        if (!user) {
            return this.log('error', `User not found`);
        }
        const store = this.getStore();
        const item = await store.findItemByName(this.params.role).one();
        if (!item) {
            return this.log('error', 'Role not found');
        }
        const assignment = await store.findAssignment().and({
            item: item._id,
            user: user.getId()
        }).one();
        if (assignment) {
            return this.log('error', 'Role already assigned');
        }
        await store.findAssignment().insert({
            item: item[store.key],
            user: user.getId()
        });
    }

    log () {
        this.owner.log(...arguments);
    }
};