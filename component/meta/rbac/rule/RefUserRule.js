/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 *
 * Check model attribute has a reference to a model that has an attribute with the current user ID
 */
'use strict';

const Base = require('./BaseRule');

module.exports = class RefUserRule extends Base {

    /**
     * @param {Object} config
     * @param {string} config.refAttr - Reference attribute name to class with user attribute
     * @param {string} config.refAttr - User attribute
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
        const value = await this.resolveRefValue();
        const matched = this.isEqual(this.getTarget().get(this.refAttr), value);
        return this.isAllow() ? matched : !matched;
    }

    async getObjectFilter () {
        if (this.objectFilter) {
            return {[this.refAttr]: await this.resolveRefValue()};
        }
    }

    async resolveRefValue () {
        if (!this._refValue) {
            const refClass = this.getTarget().class.getAttr(this.refAttr).getRefClass();
            this._refValue = await refClass.find(this.getUserCondition()).id();
        }
        return this._refValue;
    }

    getUserCondition () {
        return {[this.userAttr]: this.getUserId()};
    }
};