/**
 * @copyright Copyright (c) 2021 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const Base = require('areto/db/ActiveRecord');

module.exports = class AutoIncrement extends Base {

    static getConstants () {
        return {
            TABLE: 'ds_autoIncrement',
            ATTRS: [
                'name',
                'value'
            ],
            RULES: [
                [['name', 'value'], 'required'],
                ['name', 'string'],
                ['value', 'integer']
            ]
        };
    }

};
module.exports.init(module);