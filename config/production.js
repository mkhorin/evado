/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

module.exports = {
    parent: 'default',

    components: {
        'logger': {
            level: 'info'
        }
    },
    params: {
        'static': {
            options: {
                maxAge: 60 * 60 * 1000
            }
        },
    }
};