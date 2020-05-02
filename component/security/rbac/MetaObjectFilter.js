/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const Base = require('areto/base/Base');

module.exports = class MetaObjectFilter extends Base {

    prepare () {
        this.rules = null;
        this.condition = null;
        let ids = [], objectClass;
        for (const item of this.items) {
            if (item.rule) {
                if (item.rule.Class.prototype.getObjectFilter) {
                    ObjectHelper.push(item.rule, 'rules', this);
                }
            } else if (item.state) {
                this.appendStateCondition(item);
            } else if (item.object) {
                ids.push(item.object);
                objectClass = this.getClass(item);
            } else {
                this.all = true;
            }
        }
        if (this.all) {
            this.log('warn', 'Access denied to all objects');
        }
        if (objectClass && ids.length) {
            ObjectHelper.push(objectClass.getIdCondition(ids), 'condition', this);
        }
        if (this.condition) {
            if (this.condition.length === 1) {
                this.condition = this.condition[0];
            } else {
                this.condition.unshift('OR');
            }
        }
    }

    appendStateCondition (item) {
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