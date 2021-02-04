/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const Base = require('areto/base/Base');

module.exports = class MetaObjectFilter extends Base {

    prepare () {
        let {allow, deny} = IndexHelper.indexObjectArrays(this.items, 'type');
        let allowConditions, denyConditions;
        if (deny) {
            denyConditions = this.getConditions(deny, 'NOR');
            this.denyRules = this.getRules(deny);
        }
        if (allow) {
            allowConditions = this.getConditions(allow, 'OR');
            if (allowConditions?.length === 2) {
                allowConditions = allowConditions[1];
            }
            const rules = this.getRules(allow);
            // skip all if at least one rule is missing
            this.allowRules = rules && rules.length !== allow.length ? null : rules;
        }
        this.condition = allowConditions && denyConditions
            ? ['AND', allowConditions, denyConditions]
            : (allowConditions || denyConditions);
        this.skipped = !this.allowRules && !this.denyRules && !this.condition;
    }

    getConditions (items, operation) {
        const conditions = [];
        for (const item of items) {
            const condition = this.getItemCondition(item);
            if (!condition) {
                return null;
            }
            conditions.push(condition);
        }
        return conditions.length ? [operation, ...conditions] : null;
    }

    getItemCondition (item) {
        const cls = this.getMetadataClass(item);
        if (!cls) {
            return null;
        }
        if (item.targetType === this.rbac.TARGET_OBJECT) {
            return this.getObjectCondition(item, cls);
        }
        if (item.targetType === this.rbac.TARGET_STATE) {
            return this.getStateCondition(item, cls);
        }
    }

    getStateCondition ({state}, cls) {
        return {[cls.STATE_ATTR]: state};
    }

    getObjectCondition (item, cls) {
        const condition = cls.getIdCondition(item.object);
        if (item.state) {
            condition[cls.STATE_ATTR] = item.state;
        }
        return condition;
    }

    getRules (items) {
        const rules = [];
        for (const {rule} of items) {
            if (rule?.Class.prototype.getObjectFilter) {
                rules.push(rule);
            }
        }
        return rules.length ? rules : null;
    }

    getMetadataClass (item) {
        if (item.class && this.rbac.baseMeta) {
            return this.rbac.baseMeta.getClass(item.class)
                || this.log('error', `Item class not found: ${item.key}`);
        }
    }

    log () {
        CommonHelper.log(this.rbac, this.constructor.name, ...arguments);
    }
};

const CommonHelper = require('areto/helper/CommonHelper');
const IndexHelper = require('areto/helper/IndexHelper');