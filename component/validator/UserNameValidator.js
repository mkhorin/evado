/**
 * @copyright Copyright (c) 2020 Maxim Khorin (maksimovichu@gmail.com)
 */
'use strict';

const USER_NAME_REGEX = /(^[a-z\s-]+$)|(^[а-я\s-]+$)/i;

const Base = require('areto/validator/StringValidator');

module.exports = class UserNameValidator extends Base {

    constructor (config) {
        super({
            min: 2,
            max: 32,
            pattern: USER_NAME_REGEX,
            shrinking: true,
            ...config.module.params.userNameValidator,
            ...config
        });
    }
};