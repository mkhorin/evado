/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const Base = require('areto/db/ActiveRecord');

module.exports = class NoticeMessage extends Base {

    static getConstants () {
        return {
            TABLE: 'sys_noticeMessageUser',
            ATTRS: [
                'read',
                'message',
                'user'
            ]
        };
    }

    addMessage (message, users) {
        const data = [];
        for (const user of users) {
            data.push({read: false, message, user});
        }
        return this.find().insert(data);
    }
};
module.exports.init(module);