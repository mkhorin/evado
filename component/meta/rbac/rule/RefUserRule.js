/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

// check model attribute has a reference to a model that has an attribute with the current user ID

const Base = require('./BaseRule');

module.exports = class RefUserRule extends Base {

    constructor (config) {
        super({
            refAttr: 'executor', // reference attribute to class with user attribute
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
        const matched = this.isEqual(this.getTarget().get(this.refAttr), user);
        return this.isAllowType() ? matched : !matched;
    }

    async getObjectFilter () {
        return this.objectFilter ? {[this.refAttr]: await this.resolveRefUser()} : null;
    }

    async resolveRefUser () {
        if (!this._refUser) {
            const metaClass = this.getTarget().class.getAttr(this.refAttr).getRefClass();
            this._refUser = await metaClass.find({[this.userAttr]: this.getUserId()}).id();
        }
        return this._refUser;
    }
};