/**
 * @copyright Copyright (c) 2021 Maxim Khorin <maksimovichu@gmail.com>
 *
 * Check model attribute has a reference through a chain of references
 * to a model that has an attribute with the current user ID
 */
'use strict';

const Base = require('./BaseRule');

module.exports = class RefUserChainRule extends Base {

    /**
     * @param {Object} config
     * @param {string[]} config.refAttrs - Reference attribute names to class with user attribute
     * @param {string} config.userAttr - User attribute name
     * @param {boolean} config.objectFilter - Filter objects in list
     */
    constructor (config) {
        super({
            userAttr: 'user',
            objectFilter: true,
            ...config
        });
    }

    execute () {
        return this.isObjectTarget()
            ? this.checkRefUser()
            : this.isAllow();
    }

    async checkRefUser () {
        const values = await this.resolveRefValues();
        const value = this.getTarget().get(this.refAttrs[0]);
        const matched = MongoHelper.includes(value, values);
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
            : this.getUserCondition();
        return refClass.find(condition).ids();
    }

    getUserCondition () {
        return {[this.userAttr]: this.getUserId()};
    }

    async getObjectFilter () {
        if (this.objectFilter) {
            return {[this.refAttrs[0]]: await this.resolveRefValues()};
        }
    }
};

const MongoHelper = require('areto/helper/MongoHelper');