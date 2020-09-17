/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

module.exports = {

    'deleteExpiredFiles': {
        description: 'Delete uploaded but unrelated files',
        job: {
            Class: 'component/scheduler/DeleteExpiredFilesJob'
        },        
        period: 'PT2H',
        active: true
    },
    'createNotification': {
        description: 'Create notifications from new notice messages',
        job: {
            Class: 'component/scheduler/CreateNotificationJob'
        },        
        startup: true,
        active: true
    }
};