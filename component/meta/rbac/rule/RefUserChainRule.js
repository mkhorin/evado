/**
 * @copyright Copyright (c) 2021 Maxim Khorin <maksimovichu@gmail.com>
 *
 * Check model attribute has a reference through a chain of references
 * to a model that has an attribute with the current user ID
 */
'use strict';

const Base = require('./BaseRule');

module.exports = class RefUserChainRule extends Base {

    constructor (config) {
        super({
            // refAttrs: ['attrName1', ...], // reference attribute names to class with user attribute
            userAttr: 'user', // user attribute
            objectFilter: true, // filter objects in list
            ...config
        });
    }

    execute () {
        return this.isObjectTarget()
            ? this.checkRefUser()
            : this.isAllowType();
    }

    async checkRefUser () {
        const values = await this.resolveRefValue();
        const value = this.getTarget().get(this.refAttrs[0]);
        const matched = MongoHelper.includes(value, values);
        return this.isAllowType() ? matched : !matched;
    }

    async getObjectFilter () {
        if (this.objectFilter) {
            return {[this.refAttr]: await this.resolveRefValues()};
        }
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
            : this.getUserCondition();
        return refClass.find(condition).ids();
    }

    getUserCondition () {
        return {[this.userAttr]: this.getUserId()};
    }
};

const MongoHelper = require('areto/helper/MongoHelper');