/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 *
 * Check model attribute has the current user ID
 */
'use strict';

const Base = require('./BaseRule');

module.exports = class UserRule extends Base {

    /**
     * @param {Object} config
     * @param {string} config.userAttr - User attribute name
     * @param {boolean} config.objectFilter - Filter objects in list
     */
    constructor (config) {
        super({
            userAttr: 'user',
            objectFilter: true,
            ...config
        });
    }

    execute () {
        return this.isObjectTarget()
            ? this.checkUser()
            : this.isAllow(); // pass rule: need to allow - true, need to deny - false
    }

    checkUser () {
        const matched = this.isUser(this.getTarget().get(this.userAttr));
        return this.isAllow() ? matched : !matched;
    }

    getObjectFilter () {
        return this.objectFilter ? {[this.userAttr]: this.getUserId()} : null;
    }
};