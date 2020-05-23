/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const Base = require('areto/base/Base');

module.exports = class MetaObjectFilter extends Base {

    prepare () {
        this.rules = null;
        this.condition = null;
        let objects = [], skipFilter, objectClass;
        for (const item of this.items) {
            if (item.state) {
                this.addStateCondition(item);
                this.addRule(item.rule);
            } else if (item.object) {
                objects.push(item.object);
                objectClass = this.getClass(item);
                this.addRule(item.rule);
            } else if (!this.addRule(item.rule)) {
                skipFilter = true;
            }
        }
        if (objectClass && objects.length) {
            ObjectHelper.push(objectClass.getIdCondition(objects), 'condition', this);
        }
        if (this.condition) {
            if (this.condition.length === 1) {
                this.condition = this.condition[0];
            } else {
                this.condition.unshift('OR');
            }
        }
        return !skipFilter;
    }

    addRule (rule) {
        if (rule && rule.Class.prototype.getObjectFilter) {
            ObjectHelper.push(rule, 'rules', this);
            return true;
        }
    }

    addStateCondition (item) {
        const itemClass = this.getClass(item);
        if (!itemClass) {
            return false;
        }
        let condition = {[itemClass.STATE_ATTR]: item.state};
        if (item.object) {
            condition = ['AND', itemClass.getIdCondition(item.object), condition];
        }
        ObjectHelper.push(condition, 'condition', this);
    }

    getClass (item) {
        if (!this.rbac.baseMeta) {
            return null;
        }
        const metaClass = this.rbac.baseMeta.getClass(item.class);
        if (metaClass) {
            return metaClass;
        }
        this.log('error', `Item class not found: ${item.key}`);
    }

    log () {
        CommonHelper.log(this.rbac, this.constructor.name, ...arguments);
    }
};

const CommonHelper = require('areto/helper/CommonHelper');
const ObjectHelper = require('areto/helper/ObjectHelper');