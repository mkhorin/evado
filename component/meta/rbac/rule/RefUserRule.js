/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 *
 * Check model attribute has a reference to a model that has an attribute with the current user ID
 */
'use strict';

const Base = require('./BaseRule');

module.exports = class RefUserRule extends Base {

    constructor (config) {
        super({
            // refAttr: 'attrName', // reference attribute name to class with user attribute
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
            const refClass = this.getTarget().class.getAttr(this.refAttr).getRefClass();
            const condition = {[this.userAttr]: this.getUserId()};
            this._refUser = await refClass.find(condition).id();
        }
        return this._refUser;
    }
};