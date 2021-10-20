/**
 * @copyright Copyright (c) 2021 Maxim Khorin <maksimovichu@gmail.com>
 *
 * Check model attribute has a reference through a chain of references
 * to a model that has an attribute with the specified value
 */
'use strict';

const Base = require('./BaseRule');

module.exports = class RefValueChainRule extends Base {

    constructor (config) {
        super({
            // refAttrs: ['attrName1', ...], // reference attribute names to class with value attribute
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
        let values = await this.resolveRefValues();
        let value = this.getTarget().get(this.refAttrs[0]);
        let matched = MongoHelper.includes(value, values);
        if (this.not) {
            matched = !matched;
        }
        return this.isAllowType() ? matched : !matched;
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
            return [this.not ? 'NOT IN' : 'IN', this.refAttr, values];
        }
    }
};