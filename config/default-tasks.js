/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

module.exports = {

    'deleteExpiredFiles': {
        job: {
            Class: require('../component/scheduler/DeleteExpiredFilesJob')
        },
        period: 'PT2H'
    },
    'sendNoticeMessage': {
        job: {
            Class: require('../component/scheduler/NoticeMessageJob')
        },
        startup: true
    }
};