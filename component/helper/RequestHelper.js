/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

module.exports = class RequestHelper {

    static getArrayParam (value) {
        if (typeof value !== 'string') {
            return null;
        }
        return value ? value.split(',') : [];
    }

    static getNotEmptyArrayParam (value) {
        value = this.getArrayParam(value);
        return value?.length ? value : null;
    }
};