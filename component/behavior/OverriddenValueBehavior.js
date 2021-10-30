/**
 * @copyright Copyright (c) 2020 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const Base = require('areto/base/Behavior');

module.exports = class OverriddenValueBehavior extends Base {

    /**
     * @param {Object} config
     * @param {string[]} config.attrs - Overridden attributes
     */
    constructor (config) {
        super({
            attrPrefix: 'override-',
            originalAttr: 'original',
            originalValueMethodMap: {},
            stateAttr: 'overriddenState',
            ...config
        });
        this.setHandler(ActiveRecord.EVENT_BEFORE_INSERT, this.beforeSave);
        this.setHandler(ActiveRecord.EVENT_BEFORE_UPDATE, this.beforeSave);
    }

    hasOriginal () {
        return !!this.owner.get(this.originalAttr);
    }

    get (attrName) {
        return this.owner.get(this.getStates()[attrName] ? attrName : `${this.originalAttr}.${attrName}`);
    }

    getOriginal () {
        return this.owner.rel(this.originalAttr);
    }

    resolveOriginal () {
        return this.owner.resolveRelation(this.originalAttr);
    }

    unsetOriginal () {
        this.owner.unsetRelated(this.originalAttr);
    }

    getState (attrName) {
        const states = this.owner.get(this.stateAttr);
        return states ? states[attrName] === true : false;
    }

    /**
     * Get overridden states
     */
    getStates () {
        return this.owner.get(this.stateAttr) || {};
    }

    setStates (data) {
        this.owner.set(this.stateAttr, data);
    }

    async getAttrMap () {
        const data = {};
        const states = this.getStates();
        const original = this.getOriginal();
        const namePrefix = `${this.owner.constructor.name}[${this.stateAttr}]`;
        for (const name of this.attrs) {
            data[name] = {
                attr: this.attrPrefix + name,
                name: `${namePrefix}[${name}]`,
                overridden: states[name]
            };
            data[name].originalValue = await this.getOriginalValue(name, original);
        }
        return data;
    }

    async beforeSave () {
        this.owner.set(this.stateAttr, this.filterStates(this.getStates()));
        return this.setOriginalValues(await this.resolveOriginal());
    }

    filterStates (states = {}) {
        for (const name of Object.keys(states)) {
            states[name] = states[name] === 'true' || states[name] === true;
        }
        return states;
    }

    async setOriginalValues (original) {
        const states = this.getStates();
        for (const name of Object.keys(states)) {
            if (!states[name]) {
                this.owner.set(name, await this.getOriginalValue(name, original));
            }    
        }        
    }

    getOriginalValue (attrName, original) {
        return this.originalValueMethodMap.hasOwnProperty(attrName)
            ? this.originalValueMethodMap[attrName](original, this)
            : original.get(attrName);
    }

    hasUpdatedAttrs () {
        const states = this.getStates();
        for (const name of this.attrs) {
            if (states[name]) {
                return true;
            }
        }
        return false;
    }

    getUpdatedAttrNames () {
        const states = this.getStates();
        const names = [];
        for (const name of this.attrs) {
            if (states[name]) {
                names.push(name);
            }
        }
        return names;
    }

    getInheritedAttrNames () {
        const states = this.getStates();
        const names = [];
        for (const name of this.attrs) {
            if (!states[name]) {
                names.push(name);
            }
        }
        return names;
    }

    async setInheritedValues (original) {
        const states = this.getStates();
        for (const name of this.attrs) {
            if (!states[name]) {
                this.owner.set(name, await this.getOriginalValue(name, original));
            }
        }
    }

    setStatesByData (data) {
        const states = {};
        for (const name of this.attrs) {
            states[name] = data[name] !== undefined && data.hasOwnProperty(name);
        }
        this.setStates(states);
    }
};

const ActiveRecord = require('areto/db/ActiveRecord');