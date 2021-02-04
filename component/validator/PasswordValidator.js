/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const Base = require('areto/validator/StringValidator');

module.exports = class PasswordValidator extends Base {

    constructor (config) {
        super({
            ...config.module.getParam('userPasswordValidator'),
            ...config
        });
    }
};
