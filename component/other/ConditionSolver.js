/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const Base = require('areto/base/Base');

module.exports = class ConditionSolver extends Base {

    constructor (config) {
        super({
            // data: [condition]
            ...config
        });
        this.prepare();
    }

    prepare () {
        this.tokens = [];
        if (this.data) {
            this.prepareData(this.data);
        }
    }

    prepareData (data) {
        for (const key of Object.keys(data)) {
            const solver = this.getSolver(data[key]);
            if (solver) {
                this.tokens.push({key, data, solver});
            } else if (typeof data[key] === 'object' && data[key]) {
                this.prepareData(data[key]);
            }
        }
    }

    getSolver (value) {
        switch (value) {
            case '$now': return this.resolveNow;
            case '$user': return this.resolveUser;
        }
    }

    execute (query) {
        for (const {key, data, solver} of this.tokens) {
            data[key] = solver.call(this, query);
        }
        return this.data;
    }

    resolveNow () {
        return new Date;
    }

    resolveUser (query) {
        return query.user.getId();
    }
};