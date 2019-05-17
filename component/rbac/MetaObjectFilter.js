'use strict';

const Base = require('areto/base/Base');

module.exports = class MetaObjectFilter extends Base {

    prepare () {
        this.rules = null;
        this.condition = null;
        let ids = [], objectClass;
        for (let item of this.items) {
            if (item.rule) {
                this.appendRule(item);
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
            this.log('warn', 'Access is denied to all objects');
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

    appendRule (item) {
        if (!(item.rule.Class.prototype.getObjectCondition)) {
            return this.log('error', `getObjectCondition not found in the rule: ${item.key}`);
        }
        ObjectHelper.push(item.rule, 'rules', this);
    }

    appendStateCondition (item) {
        let itemClass = this.getClass(item);
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
        let cls = this.rbac.module.getMeta().getClass(item.class);
        if (!cls) {
            this.log('error', `Not found item class: ${item.key}`);
        }
        return cls;
    }

    log (type, message, data) {
        this.rbac.log(type, this.wrapClassMessage(message), data);
    }
};

const ObjectHelper = require('areto/helper/ObjectHelper');