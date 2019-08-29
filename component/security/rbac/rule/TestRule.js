/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const Base = require('areto/security/rbac/Rule');

module.exports = class TestRule extends Base {

    async execute () {
        return true; // can item be applied
    }

    async getObjectCondition () {
        return ['EXISTS', '_id']; // excluded object condition
    }
};