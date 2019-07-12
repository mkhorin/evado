/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

module.exports = {
    parent: 'default',
    port: 3000,
    components: {
        'logger': {
            level: 'info'
        }
    },
    params: {
        'static': {
            options: {
                maxAge: 10 * 60 * 1000
            }
        },
    }
};