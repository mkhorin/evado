/**
 * @copyright Copyright (c) 2020 Maxim Khorin (maksimovichu@gmail.com)
 */
'use strict';

const Base = require('areto/validator/StringValidator');

module.exports = class UserNameValidator extends Base {

    constructor (config) {
        super({
            min: 2,
            max: 32,
            pattern: /(^[a-z\s-]+$)|(^[а-я\s-]+$)/i,
            shrinking: true,
            ...config.module.getParam('userNameValidator'),
            ...config
        });
    }
};