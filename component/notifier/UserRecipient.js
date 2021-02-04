/**
 * @copyright Copyright (c) 2020 Maxim Khorin (maksimovichu@gmail.com)
 */
'use strict';

const Base = require('areto/base/Base');

module.exports = class UserRecipient extends Base {

    constructor (config) {
        super({
            userAttr: 'user', // order.author.user
            ...config
        });
    }

    getUsers (data) {
        return data?.model?.getNestedValue(this.userAttr);
    }
};