/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const Base = require('areto/security/Auth');

module.exports = class Auth extends Base {

    constructor (config) {
        super({
            Identity: config.module.getClass('model/User'),
            WebUser: config.module.getClass('security/WebUser'),
            ...config
        });
    }

    async afterLogin (event) {
        await event.user.log('login');
        await super.afterLogin(event);
    }
};