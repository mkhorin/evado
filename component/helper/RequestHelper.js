/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

module.exports = class RequestHelper {

    static getNotEmptyArrayParam (value) {
        value = this.getArrayParam(value);
        return value && value.length ? value : null;
    }

    static getArrayParam (value) {
        return typeof value === 'string' ? value.split(',') : null;
    }
};