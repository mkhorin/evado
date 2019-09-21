/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const Base = require('areto/security/captcha/CaptchaAction');

module.exports = class CaptchaAction extends Base {

    constructor (config) {
        super({            
            ...config.module.getParam('captcha'),
            ...config
        });
    }
};