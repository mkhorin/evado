/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const Base = require('areto/base/Base');

module.exports = class NoticeHandler extends Base {

    execute (data) {
        return this.module.getNotifier().executeById(this.notices, data);
    }
};
module.exports.init();