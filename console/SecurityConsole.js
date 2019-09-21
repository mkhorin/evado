/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const Base = require('areto/base/Base');

module.exports = class SecurityConsole extends Base {

    async createUsers () {
        this.log('info', 'Create users...');
        const items = this.app.getConfig('users') || [];
        for (const data of items) {
            await this.createUser(data);
        }
        this.log('info', 'Users ready');
    }

    async createUser () {
        try {
            const service = this.spawn('security/PasswordAuthService');
            const user = await service.register(this.params);
            this.log('info', `User created: ${this.params.email}`);
            return user;
        } catch (err) {
            return this.log('error', err);
        }
    }

    findUserByParams () {
        return this.spawnUser().findSame(this.params.name, this.params.email);
    }

    spawnUser (config) {
        return this.spawn('model/User', config);
    }

    async createRbac () {
        this.log('info', 'Create RBAC...');
        await this.app.getRbac().createByData(this.app.getConfig('rbac'));
        this.log('info', 'RBAC ready');
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
        const store = this.app.getRbac().store;
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