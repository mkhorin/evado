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
            // inspectionEnabled: false
        }
    },
    metaModels: {
        'navigation': {
            enableServiceNavigation: true
        }
    },
};