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