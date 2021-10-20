/**
 * @copyright Copyright (c) 2021 Maxim Khorin <maksimovichu@gmail.com>
 *
 * Check model attribute has a reference through a chain of references to a model in the specified state
 */
'use strict';

const Base = require('./RefValueChainRule');

module.exports = class RefStateChainRule extends Base {

    constructor (config) {
        super({
            // refAttrs: 'attrName', // reference attribute to class with states
            // value: 'state' or ['state1', 'state2', ...]
            valueAttr: Class.STATE_ATTR, // state attribute
            ...config
        });
    }
};

const Class = require('evado-meta-base/base/Class');