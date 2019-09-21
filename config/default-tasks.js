/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

module.exports = {

    'sendNoticeMessage': {
        job: {Class: require('../component/scheduler/NoticeMessageJob')},
        startup: true
    }
};