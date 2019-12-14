/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const Base = require('areto/base/Controller');

module.exports = class DefaultController extends Base {

    static getConstants () {
        return {
            ACTIONS: {
                'error': {
                    Class: require('../../../component/action/ErrorAction'),
                    ajax: true
                }
            }
        };
    }

};
module.exports.init(module);