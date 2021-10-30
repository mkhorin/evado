/**
 * @copyright Copyright (c) 2020 Maxim Khorin (maksimovichu@gmail.com)
 */
'use strict';

const Base = require('areto/base/Behavior');

module.exports = class CloneBehavior extends Base {

    /**
     * @param {Object} config
     * @param {string[]} config.excludedAttrs - Excluded attributes
     * @param {string[]} config.relations - Relation names
     */
    constructor (config) {
        super({
            excludedAttrs: [],
            ...config
        });
        this.setHandler(ActiveRecord.EVENT_AFTER_INSERT, this.afterInsert);
    }

    getOriginal () {
        return this.original;
    }

    setOriginal (original) {
        this.original = original;
        this.owner.setAttrs(original, [this.owner.PK, ...this.excludedAttrs]);
    }

    async afterInsert () {
        if (!this.original) {
            return false;
        }
        if (Array.isArray(this.relations)) {
            for (const name of this.relations) {
                await this.original.resolveRelation(name);
                await this.cloneRelation(name);
            }
        }
        if (this.owner.afterClone) {
            await this.owner.afterClone(this.original);
        }
    }

    async cloneRelation (name) {
        const related = this.original.rel(name);
        this.log('trace', `Clone relation ${name} from ${this.original.constructor.name}`);
        if (Array.isArray(related)) {
            for (const model of related) {
                await model.cloneFor(this.owner);
            }
        } else if (related) {
            await related.cloneFor(this.owner);
        }
    }
};

const ActiveRecord = require('areto/db/ActiveRecord');