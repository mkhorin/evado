/**
 * @copyright Copyright (c) 2021 Maxim Khorin <maksimovichu@gmail.com>
 *
 * Normalize a parameterized message for translation on the client side
 */
'use strict';

module.exports = class ClientMessage {

    constructor (message, params, category) {
        this.message = message;
        this.params = params;
        this.category = category;
    }

    addParams (params) {
        this.params = Object.assign(this.params || {}, params);
        return this;
    }

    translate () {
        return [this.message, this.params, this.category];
    }

    toString () {
        return this.message;
    }
};