/**
 * @copyright Copyright (c) 2021 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

module.exports = {

    build: [{
        Class: 'Packer',
        sources: [
            'jam/Jam.js',
            'jam/element/Element.js',
            'jam/actionBinder/ActionBinderAction.js',
            'jam/attr/Attr.js',
            'jam/attr/File.js',
            'jam/grid/DataGrid.js',
            'jam/grid/Renderer.js',
            'jam/list/List.js',
            'jam/list/TreeList.js',
            'jam/listFilter/ListFilterType.js',
            'jam/listFilter/ListFilterTypeString.js',
            'jam'
        ],
        target: 'vendor/jam.min.js',
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
        'vendor/select2': 'vendor/node_modules/select2/dist'
    }
};