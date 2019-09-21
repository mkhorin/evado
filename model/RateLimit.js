/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
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
                'timestamp': {Class: require('areto/behavior/TimestampBehavior')}
            }
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

    isExceeded () {
        return this.get('counter') >= this.getAttempts();
    }

    getAttempts () {
        return this.rateLimit.getAttempts(this.type);
    }

    getTimeout () {
        return this.rateLimit.getTimeout(this.type);
    }

    increment () {
        this.set('counter', this.get('counter') + 1);
        return this.update();
    }

    reset () {
        this.set('counter', 0);
        return this.update();
    }
};
module.exports.init(module);