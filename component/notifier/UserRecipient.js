/**
 * @copyright Copyright (c) 2020 Maxim Khorin (maksimovichu@gmail.com)
 */
'use strict';

const Base = require('areto/base/Base');

module.exports = class UserRecipient extends Base {

    /**
     * @param {Object} config
     * @param {Object} config.userAttr - User attribute name: order.author.user
     */
    constructor (config) {
        super({
            userAttr: 'user',
            ...config
        });
    }

    getUsers (data) {
        return data?.model?.getNestedValue(this.userAttr);
    }
};