'use strict';

const Base = require('areto/base/Behavior');

module.exports = class CloneBehavior extends Base {

    // excludedAttrs: [],
    // relations: []

    constructor (config) {
        super(config);
        this.setHandler(ActiveRecord.EVENT_AFTER_INSERT, this.afterInsert);
    }

    setSample (sample) {
        this.sample = sample;
        this.owner.setAttrs(sample, [this.owner.PK].concat(this.excludedAttrs));
    }

    async afterInsert () {
        if (!this.sample || !(this.relations instanceof Array) || !this.relations.length) {
            return;
        }
        await this.sample.findRelations(this.relations);
        for (let name of this.relations) {
            let related = this.sample.rel(name);
            this.log('trace', `Clone '${name}' relation from ${this.sample.constructor.name}`);
            if (related instanceof Array) {
                for (let model of related) {
                    await model.cloneFor(this.owner);
                }    
            } else if (related) {
                await related.clone(this.owner);
            }
        }
    }
};

const ActiveRecord = require('areto/db/ActiveRecord');