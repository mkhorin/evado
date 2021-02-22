/**
 * @copyright Copyright (c) 2021 Maxim Khorin (maksimovichu@gmail.com)
 */
'use strict';

const Base = require('areto/view/ActionView');

module.exports = class ActionView extends Base {

    static getConstants () {
        return {
            ModelHelper: require('../helper/ModelHelper'),
            SelectHelper: require('../helper/SelectHelper')
        };
    }
};
module.exports.init();
