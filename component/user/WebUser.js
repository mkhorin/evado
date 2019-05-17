'use strict';

const Base = require('areto/web/WebUser');

module.exports = class WebUser extends Base {

    async afterLogin (model, cookieBased, duration) {
        await this.logAction(this.config.UserLog.ACTION_LOGIN);
        return super.afterLogin(model, cookieBased, duration);
    }

    logAction (action, data) {
        return this.spawn(this.config.UserLog).log({
            action,
            data,
            user: this.getId(),
            ip: this.getIp()
        });
    }
};
module.exports.init();