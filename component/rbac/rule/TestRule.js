'use strict';

const Base = require('areto/rbac/Rule');

module.exports = class TestRule extends Base {

    execute () {
        return true;
    }

    getObjectCondition () {
        return ['EXISTS', '_id']; // excluded object condition
    }
};