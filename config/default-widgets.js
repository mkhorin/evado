/**
 * @copyright Copyright (c) 2021 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

module.exports = {

    'commonMenu': {
        Class: require('../component/widget/CommonMenu'),
        app: {
            title: 'Home',
            separated: true
        },
        modules: {
            api: {
                hidden: true
            }
        }
    },
    'languages': {
        Class: require('../component/widget/Languages'),
        items: [{
            code: 'en',
            label: 'English',
        }, {
            code: 'ru',
            label: 'Russian',
        }]
    },
    'notifications': {
        Class: require('../component/widget/Notifications')
    },
    'sideMenu': {
        Class: require('evado/component/widget/SideMenu')
    },
    'user': {
        Class: require('../component/widget/UserWidget')
    }
};