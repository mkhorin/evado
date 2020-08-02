/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const Base = require('./BaseRule');

// check model attribute has a reference to a model that has an attribute with the current user ID

module.exports = class RefUserRule extends Base {

    constructor (config) {
        super({
            attr: 'executor', // reference attribute to class with user attribute
            userAttr: 'user', // user attribute
            objectFilter: true, // filter objects in list
            ...config
        });
    }

    execute () {
        return this.isObjectTarget()
            ? this.checkRefUser()
            : this.isAllowType();
    }

    async checkRefUser () {
        const user = await this.resolveRefUser();
        const matched = this.isEqual(this.getTarget().get(this.attr), user);
        return this.isAllowType() ? matched : !matched;
    }

    async getObjectFilter () {
        return this.objectFilter ? {[this.attr]: await this.resolveRefUser()} : null;
    }

    async resolveRefUser () {
        if (!this._refUser) {
            const metaClass = this.getTarget().class.getAttr(this.attr).getRefClass();
            this._refUser = await metaClass.find().and({[this.userAttr]: this.getUserId()}).id();
        }
        return this._refUser;
    }
};