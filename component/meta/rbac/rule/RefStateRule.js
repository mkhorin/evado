/**
 * @copyright Copyright (c) 2021 Maxim Khorin <maksimovichu@gmail.com>
 *
 * Check model attribute has a reference to a model in the specified state
 */
'use strict';

const Base = require('./RefValueRule');

module.exports = class RefStateRule extends Base {

    /**
     * @param {Object} config
     * @param {string} config.refAttr - Reference attribute to class with states
     * @param {string|string[]} config.value - State name or names
     * @param {string} config.valueAttr - State attribute
     */
    constructor (config) {
        super({
            valueAttr: Class.STATE_ATTR,
            ...config
        });
    }
};

const Class = require('evado-meta-base/base/Class');