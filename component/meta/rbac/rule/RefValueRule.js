/**
 * @copyright Copyright (c) 2021 Maxim Khorin <maksimovichu@gmail.com>
 *
 * Check model attribute has a reference to a model that has an attribute with the specified value
 */
'use strict';

const Base = require('./BaseRule');

module.exports = class RefValueRule extends Base {

    constructor (config) {
        super({
            // refAttr: 'attrName', // reference attribute name
            // valueAttr: 'attrName', // value attribute name
            // value: 'value' or ['value1', 'value2', ...]
            // not: false, // invert comparison (not value)
            objectFilter: true, // filter objects in list
            ...config
        });
    }

    execute () {
        return this.isObjectTarget()
            ? this.checkRefValue()
            : this.isAllowType();
    }

    async checkRefValue () {
        let ref = await this.getTarget().related.resolve(this.refAttr);
        let matched = ref ? this.compareValue(ref.get(this.valueAttr)) : false;
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

    async getObjectFilter () {
        return this.objectFilter
            ? [this.not ? 'NOT IN' : 'IN', this.refAttr, await this.findRefObjectIds()]
            : null;
    }

    findRefObjectIds () {
        const refClass = this.getTarget().class.getAttr(this.refAttr).getRefClass();
        return refClass.find(this.getValueCondition()).ids();
    }

    getValueCondition () {
        return {[this.valueAttr]: this.value};
    }
};