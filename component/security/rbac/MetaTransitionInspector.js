/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 *
 * metaTransitionData
 *  role
 *    allow
 *      key [items]
 *    deny
 *      key [items]
 */
'use strict';

const Base = require('areto/security/rbac/Inspector');

module.exports = class MetaTransitionInspector extends Base {

    static concatHierarchyData (data) {
        for (const role of Object.keys(data)) {
            for (const type of Object.keys(data[role])) {
                this.concatHierarchyTypeData(data[role][type]);
            }
        }
    }

    static concatHierarchyTypeData (data) {
        const items = [];
        for (const values of Object.values(data)) {
            items.push(...values);
        }
        for (const item of items) {
            if (item.class && !item.transition && !item.object) {
                Rbac.concatFirstArrayItems(item.key, data, Rbac.ANY);
            }
        }
        for (const item of items) {
            if (item.transition || item.object) {
                Rbac.concatFirstArrayItems(item.key, data, `..${item.class}`, Rbac.ANY);
            }
        }
    }

    async execute () {
        this._transitions = this.target.transitions;
        if (!this._transitions?.length || !this.rbac.metaTransitionMap) {
            return;
        }
        this._result = {};
        this._objectKey = `.${this.target.getId()}.${this.target.class.id}`;
        this._classKey = `..${this.target.class.id}`;
        for (const role of this.assignments) {
            if (Object.hasOwn(this.rbac.metaTransitionMap, role)) {
                await this.resolveTransitionsByRole(this.rbac.metaTransitionMap[role]);
            }
        }
        this.target.transitions = Object.values(this._result);
    }

    async resolveTransitionsByRole (data) {
        const result = {};
        if (data[Rbac.ALLOW]) {
            for (const transition of this._transitions) {
                if (!Object.hasOwn(this._result, transition.name)) {
                    if (await this.checkTransition(transition, data[Rbac.ALLOW])) {
                        result[transition.name] = transition;
                    }
                }
            }
        }
        if (data[Rbac.DENY]) {
            for (const transition of Object.values(result)) {
                if (await this.checkTransition(transition, data[Rbac.DENY])) {
                    delete result[transition.name];
                }
            }
        }
        Object.assign(this._result, result);
    }

    async checkTransition ({name}, data) {
        const items = data[name + this._objectKey]
            || data[name + this._classKey]
            || data[this._objectKey]
            || data[this._classKey]
            || data[Rbac.ANY];
        return items ? this.checkItems(items) : false;
    }

    async checkItems (items) {
        for (const {rules} of items) {
            if (!rules || await this.checkRules(rules)) {
                return true;
            }
        }
        return false;
    }
};

const Rbac = require('./Rbac');