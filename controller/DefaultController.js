'use strict';

const Base = require('../component/BaseController');

module.exports = class DefaultController extends Base {

    static getConstants () {
        return {
            ACTIONS: {
                'error': require('../component/action/ErrorAction'),
                'order-rel': require('../component/action/OrderRelAction'),
                'widget': require('../component/action/WidgetAction')
            }
        };
    }

    actionIndex () {
        return this.render('index');
    }
};
module.exports.init(module);