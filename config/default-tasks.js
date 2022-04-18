/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

module.exports = {

    'deleteExpiredFiles': {
        description: 'Delete uploaded but unrelated files',
        job: {
            Class: 'component/job/DeleteExpiredFiles'
        },
        period: 'PT2H',
        active: true
    },
    'deleteExpiredSessions': {
        description: 'Delete expired login sessions',
        job: {
            Class: 'component/job/DeleteExpiredSessions'
        },
        period: 'PT1H',
        active: true,
        startup: true
    },
    'sendNotifications': {
        description: 'Send notifications on new messages',
        job: {
            Class: 'component/job/SendNotifications'
        },
        startup: true,
        active: true
    }
};