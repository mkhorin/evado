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
        active: true
    },
    'sendNoticeMessage': {
        job: {
            Class: 'component/scheduler/NoticeMessageJob'
        },        
        startup: true,
        active: true
    }
};