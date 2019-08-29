/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

module.exports = {

    'noticeMessageSending': {
        job: {Class: require('../component/scheduler/NoticeMessageJob')},
        startup: true
    }
};