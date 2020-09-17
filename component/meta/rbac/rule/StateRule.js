/**
 * @copyright Copyright (c) 2020 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

// check object state

const Base = require('./BaseRule');

module.exports = class StateRule extends Base {

    constructor (config) {
        super({
            // state: 'name' or ['name1', ...]
            objectFilter: true, // filter objects in list
            ...config
        });
    }

    execute () {
        return this.isObjectTarget()
            ? this.checkState()
            : this.isAllowType(); // pass rule: need to allow - true, need to deny - false
    }

    checkState () {
        const state = this.getTarget().getStateName();
        const matched = Array.isArray(this.state)
            ? this.state.includes(state)
            : this.state === state;
        return this.isAllowType() ? matched : !matched;
    }

    getObjectFilter () {
        return this.objectFilter ? {[Class.STATE_ATTR]: this.state} : null;
    }
};

const Class = require('evado-meta-base/base/Class');