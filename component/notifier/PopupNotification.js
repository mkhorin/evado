/**
 * @copyright Copyright (c) 2020 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const Base = require('areto/db/ActiveRecord');

module.exports = class PopupNotification extends Base {

    static getConstants () {
        return {
            TABLE: 'sys_popup_notification',
            ATTRS: [
                'read',
                'message',
                'user'
            ]
        };
    }

    create (message, users) {
        const read = false;
        const items = [];
        const ids = this.getDb().normalizeId(users);
        for (const user of ids) {
            items.push({read, message, user});
        }
        if (items.length) {
            return this.createQuery().insert(items);
        }
    }
};
module.exports.init(module);