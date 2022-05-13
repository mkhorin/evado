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

    async afterLogin (data) {
        await data.user.log('login');
        await this.module.emit('auth.login', data);
        await super.afterLogin(data);
    }

    async afterLogout (data) {
        await this.module.emit('auth.logout', data);
        await super.afterLogout(data);
    }
};