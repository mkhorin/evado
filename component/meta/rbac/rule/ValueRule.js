/**
 * @copyright Copyright (c) 2021 Maxim Khorin <maksimovichu@gmail.com>
 *
 * Check object attribute value
 */
'use strict';

const Base = require('./BaseRule');

module.exports = class ValueRule extends Base {

    /**
     * @param {Object} config
     * @param {string} config.valueAttr - Value attribute name
     * @param {string|string[]} config.value
     * @param {boolean} config.not - Invert comparison
     * @param {boolean} config.objectFilter - Filter objects in list
     */
    constructor (config) {
        super({
            objectFilter: true,
            ...config
        });
    }

    execute () {
        return this.isObjectTarget()
            ? this.checkValue()
            : this.isAllow(); // pass rule: need to allow - true, need to deny - false
    }

    checkValue () {
        let value = this.getTarget().get(this.valueAttr);
        let matched = this.compareValue(value);
        if (this.not) {
            matched = !matched;
        }
        return this.isAllow() ? matched : !matched;
    }

    compareValue (value) {
        return Array.isArray(this.value)
            ? this.value.includes(value)
            : this.value === value;
    }

    getObjectFilter () {
        return this.objectFilter ? this.getValueCondition() : null;
    }

    getValueCondition () {
        return {[this.valueAttr]: this.value};
    }
};