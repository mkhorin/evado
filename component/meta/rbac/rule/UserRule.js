/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 *
 * Check model attribute has the current user ID
 */
'use strict';

const Base = require('./BaseRule');

module.exports = class UserRule extends Base {

    constructor (config) {
        super({
            userAttr: 'user', // user attribute
            objectFilter: true, // filter objects in list
            ...config
        });
    }

    execute () {
        return this.isObjectTarget()
            ? this.checkUser()
            : this.isAllowType(); // pass rule: need to allow - true, need to deny - false
    }

    checkUser () {
        const matched = this.isUser(this.getTarget().get(this.userAttr));
        return this.isAllowType() ? matched : !matched;
    }

    getObjectFilter () {
        return this.objectFilter ? {[this.userAttr]: this.getUserId()} : null;
    }
};