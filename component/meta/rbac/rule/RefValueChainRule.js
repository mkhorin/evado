/**
 * @copyright Copyright (c) 2021 Maxim Khorin <maksimovichu@gmail.com>
 *
 * Check model attribute has a reference through a chain of references
 * to a model that has an attribute with the specified value
 */
'use strict';

const Base = require('./BaseRule');

module.exports = class RefValueChainRule extends Base {

    /**
     * @param {Object} config
     * @param {string[]} config.refAttrs - Reference attribute names to class with value attribute
     * @param {string} config.valueAttr - Value attribute name
     * @param {number|number[]|string|string[]} config.value
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
        let values = await this.resolveRefValues();
        let value = this.getTarget().get(this.refAttrs[0]);
        let matched = MongoHelper.includes(value, values);
        if (this.not) {
            matched = !matched;
        }
        return this.isAllow() ? matched : !matched;
    }

    async resolveRefValues () {
        if (!this._refValues) {
            this._refValues = await this.resolveNextValues(this.getTarget().class);
        }
        return this._refValues;
    }

    async resolveNextValues (targetClass, index = 0) {
        const refClass = targetClass.getAttr(this.refAttrs[index]).getRefClass();
        const refAttr = this.refAttrs[index + 1];
        const condition = refAttr
            ? {[refAttr]: await this.resolveNextValues(refClass, index + 1)}
            : this.getValueCondition();
        return refClass.find(condition).ids();
    }

    async getObjectFilter () {
        if (this.objectFilter) {
            const values = await this.resolveRefValues();
            return [this.not ? 'NOT IN' : 'IN', this.refAttrs[0], values];
        }
    }
};