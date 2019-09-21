/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

module.exports = {
    source: 'asset/vendor',
    target: 'web/vendor',
    defaults: {base: ['dist', 'min', 'build']},
    defaultBase: 'base',
    files: {
        '@fortawesome': [
            'fontawesome-free/css',
            'fontawesome-free/webfonts'
        ],
        'admin-lte': [
            'dist/css',
            'dist/js/adminlte.min.js'
        ],
        'bootstrap': ['dist'],
        'bootstrap-daterangepicker': [
            'daterangepicker.css',
            'daterangepicker.js'
        ],
        'eonasdan-bootstrap-datetimepicker': ['build'],
        'jquery': ['dist'],
        'inputmask': ['dist/min/jquery.inputmask.bundle.min.js'],
        // 'ionicons-min': ['css','fonts'],
        'moment': ['locale','min'],
        'select2': ['dist'],
        'store-js': [
            'dist/store.modern.min.js'
        ]
    }
};