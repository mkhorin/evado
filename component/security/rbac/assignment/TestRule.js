/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const Base = require('areto/base/Base');

module.exports = class TestRule extends Base {

    async execute (item, userId) {
        return true;  // can assign item to user
    }

    async getUsers (item) {
        return []; // get user ids to assign item
    }
};