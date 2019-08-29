/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const Base = require('areto/security/Auth');

module.exports = class Auth extends Base {

    constructor (config) {
        super({
            ...config
        });
    }

    async afterLogin (event) {
        await this.logUser('login', event.user);
        return super.afterLogin(event);
    }

    logUser () {
        return this.spawn('model/UserLog').create(...arguments);
    }
};