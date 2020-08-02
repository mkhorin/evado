/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const Base = require('./BaseRule');

// check model attribute has the current user ID

module.exports = class UserRule extends Base {

    constructor (config) {
        super({
            attr: 'user', // user attribute
            objectFilter: true, // filter objects in list
            ...config
        });
    }

    execute () {
        return this.isObjectTarget() // list targets filter by getObjectFilter
            ? this.checkUser()
            : this.isAllowType(); // pass rule: need to allow - true, need to deny - false
    }

    checkUser () {
        const matched = this.isUser(this.getTarget().get(this.attr));
        return this.isAllowType() ? matched : !matched;
    }

    getObjectFilter () {
        return this.objectFilter ? {[this.attr]: this.getUserId()} : null;
    }
};