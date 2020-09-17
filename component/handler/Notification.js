/**
 * @copyright Copyright (c) 2020 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const Base = require('areto/base/Base');

module.exports = class Notification extends Base {

    async execute (data) {
        data = await this.prepareData(data);
        return this.module.getNotifier().executeByNames(this.notice, data);
    }

    prepareData () {
        return this.data;
    }
};