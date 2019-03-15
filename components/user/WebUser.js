'use strict';

const Base = require('areto/web/WebUser');

module.exports = class WebUser extends Base {

    afterLogin (model, cookieBased, duration) {
        this.logAction(this.config.UserLog.ACTION_LOGIN);
        return super.afterLogin(model, cookieBased, duration);
    }

    logAction (action, data) {
        try {
            (new this.config.UserLog).log({
                'action': action,
                'data': data,
                'user': this.getId(),
                'ip': this.getIp()
            });    
        } catch (err) {
            this.log('error', err);            
        }        
    }
};
module.exports.init();