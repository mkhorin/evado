'use strict';

const Base = require('areto/db/ActiveRecord');

module.exports = class RateLimit extends Base {

    static getConstants () {
        return {
            TABLE: 'sys_rateLimit',
            ATTRS: [
                'type',
                'ip',
                'counter',
                'createdAt',
                'updatedAt'
            ],
            BEHAVIORS: {
                'timestamp': require('areto/behavior/TimestampBehavior')
            },
            RATE_LIMIT: 3
        };
    }

    async resolveModel (type, ip) {
        let model = await this.find({type, ip}).one();
        if (!model) {
            model = model || this;
            model.assignAttrs({type, ip});
        }
        return model;
    }

    constructor (config) {
        super(config);
        this.set('counter', 0)
    }

    isExceeded (value = this.RATE_LIMIT) {
        return this.get('counter') > value;
    }

    increment () {
        this.set('counter', this.get('counter') + 1);
        this.forceSave(()=>{});
    }

    reset () {
        this.set('counter', 0);
        this.forceSave(()=>{});
    }
};
module.exports.init();