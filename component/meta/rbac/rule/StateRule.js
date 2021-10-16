/**
 * @copyright Copyright (c) 2021 Maxim Khorin <maksimovichu@gmail.com>
 *
 * Check object state
 */
'use strict';

const Base = require('./ValueRule');

module.exports = class StateRule extends Base {

    constructor (config) {
        super({
            // value: 'state' or ['state1', 'state2', ...]
            valueAttr: Class.STATE_ATTR,
            ...config
        });
    }
};

const Class = require('evado-meta-base/base/Class');