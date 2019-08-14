/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

module.exports = {
    parent: 'default',
    port: 3000,
    components: {
        'logger': {
            level: 'trace'
        },
        'metaHub': {
            // inspectionEnabled: false
        }
    },
    params: {
    },
    metaModels: {
        'navigation': {
            enableServiceNavigation: true
        }
    },
};