/**
 * @copyright Copyright (c) 2021 Maxim Khorin <maksimovichu@gmail.com>
 *
 * Check model attribute has a reference to a model in the specified state
 */
'use strict';

const Base = require('./RefValueRule');

module.exports = class RefStateRule extends Base {

    constructor (config) {
        super({
            // refAttr: 'attrName', // reference attribute to class with states
            // value: 'state' or ['state1', 'state2', ...]
            valueAttr: Class.STATE_ATTR, // state attribute
            ...config
        });
    }
};

const Class = require('evado-meta-base/base/Class');