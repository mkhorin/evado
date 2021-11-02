/**
 * @copyright Copyright (c) 2021 Maxim Khorin (maksimovichu@gmail.com)
 */
'use strict';

const Base = require('evado-meta-base/validator/Validator');

module.exports = class CustomValidator extends Base {

    /**
     * Create a parameterized message for translation on the client side
     */
    createClientMessage (message, defaultMessage, params, category) {
        return new ClientMessage(message || defaultMessage, params, category);
    }
};

const ClientMessage = require('../misc/ClientMessage');