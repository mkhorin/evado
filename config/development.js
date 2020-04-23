/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

module.exports = {

    parent: 'default',

    components: {
        'logger': {
            level: 'trace'
        },
        'metaHub': {
        }
    },
    metaModels: {
        'navigation': {
            enableServiceNavigation: true
        }
    },
    params: {
        'captcha': {
            fixedVerifyCode: '123'
        }
    }
};