/**
 * @copyright Copyright (c) 2020 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const Base = require('areto/error/HttpException');

module.exports = class InvalidMetadata extends Base {

    constructor (err, data) {
        super(501, err || 'Invalid metadata', data);
    }
};