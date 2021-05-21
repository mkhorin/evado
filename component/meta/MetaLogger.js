/**
 * @copyright Copyright (c) 2021 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const Base = require('areto/base/Base');

module.exports = class MetaLogger extends Base {

    constructor () {
        super(...arguments);
        this.errors = [];
    }

    clearErrors () {
        this.errors = [];
    }

    log (type, message) {
        if (type === 'error') {
            this.errors.push(message);
        }
        CommonHelper.log(this.module, 'META', ...arguments);
    }
};

const CommonHelper = require('areto/helper/CommonHelper');