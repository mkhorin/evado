/**
 * @copyright Copyright (c) 2021 Maxim Khorin <maksimovichu@gmail.com>
 *
 * Check model attribute has a reference through a chain of references to a model in the specified state
 */
'use strict';

const Base = require('./RefValueChainRule');

module.exports = class RefStateChainRule extends Base {

    /**
     * @param {Object} config
     * @param {string[]} config.refAttrs - Reference attributes to class with states
     * @param {string|string[]} config.value - State name or names
     * @param {string} config.valueAttr - State attribute name
     */
    constructor (config) {
        super({
            valueAttr: Class.STATE_ATTR,
            ...config
        });
    }
};

const Class = require('evado-meta-base/base/Class');