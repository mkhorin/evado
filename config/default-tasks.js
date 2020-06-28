/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

module.exports = {

    'deleteExpiredFiles': {        
        job: {
            Class: 'component/scheduler/DeleteExpiredFilesJob'
        },        
        period: 'PT2H',
        active: true,
        description: 'Delete uploaded but unrelated files'
    },
    'createNotification': {
        job: {
            Class: 'component/scheduler/CreateNotificationJob'
        },        
        startup: true,
        active: true,
        description: 'Create notifications from new messages'
    }
};