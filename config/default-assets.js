/**
 * @copyright Copyright (c) 2021 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

module.exports = {

    build: [{
        Class: 'FileMerger',
        sources: [
            'jam/Jam.js',
            'jam/element/Element.js',
            'jam/attr/Attr.js',
            'jam/dataGrid/DataGrid.js',
            'jam/dataGrid/Renderer.js',
            'jam/list/List.js',
            'jam'
        ],
        target: 'dist/jam.min.js',
        copyright: `/* @copyright Copyright (c) 2021 Maxim Khorin <maksimovichu@gmail.com> */\n`
    }],

    deploy: {
        'vendor/fontawesome/css': 'vendor/node_modules/@fortawesome/fontawesome-free/css',
        'vendor/fontawesome/webfonts': 'vendor/node_modules/@fortawesome/fontawesome-free/webfonts',
        'vendor/bootstrap': 'vendor/node_modules/bootstrap/dist',
        'vendor/jquery': 'vendor/node_modules/jquery/dist',
        'vendor/inputmask': 'vendor/node_modules/inputmask/dist',
        'vendor/moment/locale': 'vendor/node_modules/moment/locale',
        'vendor/moment/min': 'vendor/node_modules/moment/min',
        'vendor/select2': 'vendor/node_modules/select2/dist',
        'vendor': 'dist/jam.min.js'
    }
};