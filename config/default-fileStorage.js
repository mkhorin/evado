/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

module.exports = {
    Class: require('../component/file/FileStorage'),
    basePath: 'upload/file',
    preview: {
        basePath: 'upload/preview',
        sizes: {
            'tiny': {
                width: 64,
                height: 64
            },
            'small': {
                width: 256,
                height: 256
            },
            'medium': {
                width: 512,
                height: 512
            },
            'large': {
                width: 1024,
                height: 1024
            }
        }
    }
};