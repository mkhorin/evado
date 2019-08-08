/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const Base = require('../../base/Base');

module.exports = class Passport extends Base {

    constructor (config) {
        super({
            ...config
        });
    }
};