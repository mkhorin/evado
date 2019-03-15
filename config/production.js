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