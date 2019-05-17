'use strict';

const Base = require('areto/base/Base');

module.exports = class AuthConsole extends Base {

    async createUsers () {
        let items = this.app.getConfig('users') || [];
        for (let data of items) {
            await this.createUser(data);
        }
    }

    async createRbac () {
        await this.app.get('rbac').createByData(this.app.getConfig('rbac'));
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
            ? this.log('info', `Password has been changed`)
            : this.log('error', user.getFirstErrors());
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

    async createUser (data) {
        let model = this.createUserModel({scenario: 'create'});
        model.setSafeAttrs(data);
        if (!await model.save()) {
            return this.log('error', model.getFirstErrors());
        }
        this.log('info', `User has been created: ${data.email}`);
        return model;
    }

    findUserByParams () {
        return this.createUserModel().findSame(this.params.name, this.params.email);
    }

    createUserModel (params) {
        return this.app.get('user').createUserModel(params);
    }

    log (...args) {
        this.console.log(...args);
    }
};