/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const Base = require('areto/db/ActiveRecord');

module.exports = class ListFilter extends Base {

    static getConstants () {
        return {
            TABLE: 'sys_listFilter',
            ATTRS: [
                'name',
                'target',
                'conditions',
                'author'
            ],
            RULES: [
                [['name', 'conditions'], 'required'],
                ['name', 'string', {min: 2, max: 32}],
                ['name', 'regexp', {pattern: /^[0-9a-zа-я-_ ]+$/i}],
                ['name', 'unique'],
                [['target', 'conditions'], 'string'],
                ['target', 'default']
            ]
        };
    }

    static findByTarget (target) {
        return this.find({target: [null, target]});
    }
};
module.exports.init();