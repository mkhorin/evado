/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const Base = require('areto/base/Base');

module.exports = class BaseAssignmentRule extends Base {

    /**
     * Can assign item to user
     * @param item - Role (permission) with this rule
     * @param userId - Current user ID
     * @returns {boolean}
     */
    async execute (item, userId) {
        return true;
    }

    /**
     * Get all user IDs that can be assigned item
     * This method is optional. Used to create a user filter for a given item
     * @param item - Role (permission) with this rule
     * @returns {Array}
     */
    async getUsers (item) {
        return [];
    }
};