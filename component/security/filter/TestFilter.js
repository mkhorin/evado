/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const Base = require('./BaseFilter');

module.exports = class TestFilter extends Base {

    async execute () {
        return 0;
    }
};