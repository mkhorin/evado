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
                'config'
            ]
        };
    }

    resolve () {
        try {
            this._config = ClassHelper.resolveSpawn(this.get('config'), this.module);
            return true;
        } catch (err) {
            this.log('error', 'Configuration failed:', err);
        }
    }

    execute (data) {
        return this.spawn(this._config).execute(data);
    }
};
module.exports.init(module);

const ClassHelper = require('areto/helper/ClassHelper');