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
    'sendNotifications': {
        description: 'Send notifications on new messages',
        job: {
            Class: 'component/job/SendNotifications'
        },
        startup: true,
        active: true
    }
};