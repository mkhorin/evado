/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const Base = require('areto/base/Base');

module.exports = class AuthConsole extends Base {

    async createUsers () {
        this.log('info', 'Create users...');
        let items = this.app.getConfig('users') || [];
        for (let data of items) {
            await this.createUser(data);
        }
        this.log('info', 'Users created');
    }

    async createUser (data) {
        let model = this.createUserModel({scenario: 'create'});
        model.setSafeAttrs(data);
        if (!await model.save()) {
            return this.log('error', model.getFirstErrorMap());
        }
        this.log('info', `User created: ${data.email}`);
        return model;
    }

    findUserByParams () {
        return this.createUserModel().findSame(this.params.name, this.params.email);
    }

    createUserModel (params) {
        return this.app.get('user').createUserModel(params);
    }

    async createRbac () {
        this.log('info', 'Create RBAC...');
        await this.app.get('rbac').createByData(this.app.getConfig('rbac'));
        this.log('info', 'RBAC created');
    }

    async signUp () {
        await this.createUser({
            name: this.params.name,
            email: this.params.email,
            password: this.params.password
        });
    }

    async changePassword () {
        let user = await this.findUserByParams().one();
        if (!user) {
            return this.log('error', `User not found`);
        }
        user.set('password', this.params.password);
        await user.save()
            ? this.log('info', `Password changed`)
            : this.log('error', user.getFirstErrorMap());
    }

    async assignRole () {
        let user = await this.findUserByParams().one();
        if (!user) {
            return this.log('error', `User not found`);
        }
        let store = this.app.get('rbac').store;
        let item = await store.findItemByName(this.params.role).one();
        if (!item) {
            return this.log('error', 'Role not found');
        }
        let assignment = await store.findAssignment().and({
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
        this.console.log(...arguments);
    }
};