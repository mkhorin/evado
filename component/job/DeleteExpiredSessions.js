/**
 * @copyright Copyright (c) 2022 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const Base = require('areto/scheduler/Job');

module.exports = class DeleteExpiredSessions extends Base {

    async execute () {
        await this.module.getSession().deleteExpired();
    }
};