/**
 * @copyright Copyright (c) 2021 Maxim Khorin <maksimovichu@gmail.com>
 *
 * Check object attribute value
 */
'use strict';

const Base = require('./BaseRule');

module.exports = class ValueRule extends Base {

    constructor (config) {
        super({
            // valueAttr: 'attrName', // value attribute name
            // value: 'value' or ['value1', 'value2', ...]
            // not: false, // invert comparison (not value)
            objectFilter: true, // filter objects in list
            ...config
        });
    }

    execute () {
        return this.isObjectTarget()
            ? this.checkValue()
            : this.isAllowType(); // pass rule: need to allow - true, need to deny - false
    }

    checkValue () {
        let value = this.getTarget().get(this.valueAttr);
        let matched = this.compareValue(value);
        if (this.not) {
            matched = !matched;
        }
        return this.isAllowType() ? matched : !matched;
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