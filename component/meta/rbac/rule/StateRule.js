/**
 * @copyright Copyright (c) 2021 Maxim Khorin <maksimovichu@gmail.com>
 *
 * Check object state
 */
'use strict';

const Base = require('./ValueRule');

module.exports = class StateRule extends Base {

    /**
     * @param {Object} config
     * @param {string|string[]} config.value - State name or names
     */
    constructor (config) {
        super({
            valueAttr: Class.STATE_ATTR,
            ...config
        });
    }
};

const Class = require('evado-meta-base/base/Class');