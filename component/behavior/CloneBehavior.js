/**
 * @copyright Copyright (c) 2019 Maxim Khorin (maksimovichu@gmail.com)
 */
'use strict';

const Base = require('areto/base/Behavior');

module.exports = class CloneBehavior extends Base {

    // excludedAttrs: [],
    // relations: []

    constructor (config) {
        super(config);
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
        if (this.original && Array.isArray(this.relations) && this.relations.length) {
            await this.original.resolveRelations(this.relations);
            for (const name of this.relations) {
                await this.cloneRelation(name);
            }
        }
    }

    async cloneRelation (name) {
        const related = this.original.rel(name);
        this.log('trace', `Clone relation: ${name} from ${this.original.constructor.name}`);
        if (!Array.isArray(related)) {
            return related.clone(this.owner);
        }
        for (const model of related) {
            await model.cloneFor(this.owner);
        }
    }
};

const ActiveRecord = require('areto/db/ActiveRecord');