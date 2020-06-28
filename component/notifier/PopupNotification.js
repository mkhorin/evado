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
        for (const user of this.getDb().normalizeId(users)) {
            items.push({read, message, user});
        }
        if (items.length) {
            return this.find().insert(items);
        }
    }
};
module.exports.init(module);