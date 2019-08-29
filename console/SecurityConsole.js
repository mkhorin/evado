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

    async createUser (data) {
        const model = this.spawnUser({scenario: 'create'});
        model.setSafeAttrs(data);
        if (!await model.save()) {
            return this.log('error', model.getFirstErrorMap());
        }
        this.log('info', `User created: ${data.email}`);
        return model;
    }

    findUserByParams () {
        return this.spawnUser().findSame(this.params.name, this.params.email);
    }

    spawnUser (config) {
        return this.spawn('model/User', config);
    }

    async createRbac () {
        this.log('info', 'Create RBAC...');
        await this.app.get('rbac').createByData(this.app.getConfig('rbac'));
        this.log('info', 'RBAC ready');
    }

    async signUp () {
        await this.createUser({
            name: this.params.name,
            email: this.params.email,
            password: this.params.password
        });
    }

    async changePassword () {
        const user = await this.findUserByParams().one();
        if (!user) {
            return this.log('error', `User not found`);
        }
        user.set('password', this.params.password);
        await user.save()
            ? this.log('info', `Password changed`)
            : this.log('error', user.getFirstErrorMap());
    }

    async assignRole () {
        const user = await this.findUserByParams().one();
        if (!user) {
            return this.log('error', `User not found`);
        }
        const store = this.app.get('rbac').store;
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