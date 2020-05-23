/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const Base = require('./BaseRule');

// check model attribute has the current user ID

module.exports = class AuthorRule extends Base {

    constructor (config) {
        super({
            userAttr: '_creator', // user attribute
            objectFilter: true, // filter objects in a list
            ...config
        });
    }

    execute () {
        return this.isObjectTarget() // list targets filter by getObjectFilter
            ? this.checkAuthor()
            : this.isAllowType(); // pass rule: need to allow - true, need to deny - false
    }

    checkAuthor () {
        const matched = this.isUser(this.getTarget().get(this.userAttr));
        return this.isAllowType() ? matched : !matched;
    }

    getObjectFilter () {
        return this.objectFilter ? {[this.userAttr]: this.getUserId()} : null;
    }
};