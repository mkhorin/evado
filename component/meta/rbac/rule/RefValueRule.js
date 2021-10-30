/**
 * @copyright Copyright (c) 2021 Maxim Khorin <maksimovichu@gmail.com>
 *
 * Check model attribute has a reference to a model that has an attribute with the specified value
 */
'use strict';

const Base = require('./BaseRule');

module.exports = class RefValueRule extends Base {

    /**
     * @param {Object} config
     * @param {string} config.refAttr - Reference attribute name to class with value attribute
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
            ? this.checkRefValue()
            : this.isAllow();
    }

    async checkRefValue () {
        let ref = await this.getTarget().related.resolve(this.refAttr);
        let matched = ref ? this.compareValue(ref.get(this.valueAttr)) : false;
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

    async getObjectFilter () {
        if (this.objectFilter) {
            const values = await this.findRefObjectIds();
            return [this.not ? 'NOT IN' : 'IN', this.refAttr, values];
        }
    }

    findRefObjectIds () {
        const refClass = this.getTarget().class.getAttr(this.refAttr).getRefClass();
        return refClass.find(this.getValueCondition()).ids();
    }

    getValueCondition () {
        return {[this.valueAttr]: this.value};
    }
};