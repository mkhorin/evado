/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 *
 * transition is denied if transition is denied
 * transition is allowed if transition is allowed
 * transitions is allowed if model update is allowed
 */
'use strict';

const Base = require('areto/security/rbac/Inspector');

module.exports = class MetaTransitionInspector extends Base {

    /**
     * metaTransitionData
     * role
     *   allow
     *     key [items]
     *   deny
     *     key [items]
     */

    static concatHierarchyItems (items, data) {
        for (const item of items) {
            if (item.transition && item.object) {
                this.concatHierarchyItem(item, data, `${item.transition}..${item.class}`);
            }
        }
    }

    static concatHierarchyItem (item, data, ...keys) {
        for (const role of Object.keys(data)) {
            for (const type of Object.keys(data[role])) {
                if (Array.isArray(data[role][type][item.key])) {
                    Rbac.concatFirstArrayItems(item.key, data[role][type], ...keys);
                }
            }
        }
    }

    async execute () {
        this._transitions = this.target.transitions;
        if (!this._transitions || !this._transitions.length || !this.rbac.metaTransitionMap) {
            return;
        }
        this._result = {};
        this._objectKey = `.${this.target.getId()}.${this.target.class.id}`;
        this._classKey = `..${this.target.class.id}`;
        if (this.editableTarget) { // transitions is allowed if model update is allowed
            for (const role of this.assignments) {
                if (!Object.prototype.hasOwnProperty.call(this.rbac.metaTransitionMap, role)) {
                    return; // all transitions ia allowed for role
                }
            }
        }
        for (const role of this.assignments) {
            if (Object.prototype.hasOwnProperty.call(this.rbac.metaTransitionMap, role)) {
                await this.resolveTransitionsByRole(this.rbac.metaTransitionMap[role]);
            }
        }
        this.target.transitions = Object.values(this._result);
    }

    async resolveTransitionsByRole (data) {
        const result = {};
        if (data[Rbac.ALLOW]) {
            const commonAllowed = await this.checkCommonItems(data[Rbac.ALLOW]);
            if (commonAllowed) {
                this.indexNewTransitions(result);
            } else {
                await this.indexAllowedTransitions(data[Rbac.ALLOW], result, commonAllowed);
            }
        } else if (this.editableTarget) {
            this.indexNewTransitions(result);
        }
        if (data[Rbac.DENY]) {
            if (await this.checkCommonItems(data[Rbac.DENY])) {
                return;
            }
            for (const transition of Object.values(result)) {
                if (await this.checkTransitionItems(transition, data[Rbac.DENY])) {
                    delete result[transition.name];
                }
            }
        }
        Object.assign(this._result, result);
    }

    checkCommonItems (data) {
        const items = data[this._objectKey] || data[this._classKey] || data['..'];
        return items ? this.checkItems(items) : undefined;
    }

    checkTransitionItems (transition, data) {
        const items = data[transition.name + this._objectKey] || data[transition.name + this._classKey];
        return items ? this.checkItems(items) : undefined;
    }

    async checkItems (items) {
        for (const {rules} of items) {
            if (!rules || await this.checkRules(rules)) {
                return true;
            }
        }
        return false;
    }

    indexNewTransitions (result) {
        for (const transition of this._transitions) {
            if (!Object.prototype.hasOwnProperty.call(this._result, transition.name)) {
                result[transition.name] = transition;
            }
        }
    }

    async indexAllowedTransitions (data, result, commonAllowed) {
        commonAllowed = commonAllowed === undefined && this.editableTarget;
        for (const transition of this._transitions) {
            if (!Object.prototype.hasOwnProperty.call(this._result, transition.name)) {
                const allowed = await this.checkTransitionItems(transition, data);
                if (allowed || (commonAllowed && allowed === undefined)) {
                    result[transition.name] = transition;
                }
            }
        }
    }
};

const Rbac = require('./Rbac');