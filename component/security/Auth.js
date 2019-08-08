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

    async afterLogin ({user}) {
        await this.logAction(this.UserLog.ACTION_LOGIN, user);
        return super.afterLogin(...arguments);
    }

    logAction (action, user) {
        return this.spawn(this.UserLog).log({
            action,
            user: user.getId(),
            ip: user.getIp()
        });
    }
};