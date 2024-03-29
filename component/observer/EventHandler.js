/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const Base = require('areto/db/ActiveRecord');

module.exports = class EventHandler extends Base {

    static getConstants () {
        return {
            TABLE: 'sys_eventHandler',
            ATTRS: [
                'name',
                'label',
                'description',
                'config'
            ],
            RULES: [
                [['name', 'config'], 'required'],
                ['name', 'regex', {pattern: /^[0-9a-zA-Z-]+$/}],
                ['name', 'unique'],
                [['label', 'description'], 'string'],
                ['config', 'spawn']
            ]
        };
    }

    getTitle () {
        return this.get('label') || this.get('name');
    }

    toString () {
        return `${this.constructor.name}: ${this.get('name')}`;
    }

    resolve () {
        try {
            const data = CommonHelper.parseJson(this.get('config'));
            this._config = ClassHelper.resolveSpawn(data, this.module);
            return true;
        } catch (err) {
            this.log('error', 'Configuration failed:', err);
        }
    }

    execute () {
        return this.spawn(this._config).execute(...arguments);
    }
};
module.exports.init(module);

const ClassHelper = require('areto/helper/ClassHelper');
const CommonHelper = require('areto/helper/CommonHelper');