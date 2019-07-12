/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const Base = require('../component/base/BaseController');

module.exports = class DefaultController extends Base {

    static getConstants () {
        return {
            ACTIONS: {
                'error': require('../component/action/ErrorAction'),                
                'widget': require('../component/action/WidgetAction')
            }
        };
    }

    actionIndex () {
        return this.render('index');
    }
};
module.exports.init(module);