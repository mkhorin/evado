/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const Base = require('areto/base/Component');

module.exports = class Mailer extends Base {

    constructor (config) {
        super({

            ...config
        });
    }

    async init () {

    }
};
module.exports.init();