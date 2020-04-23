/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const Base = require('areto/filter/ActionFilter');

module.exports = class ExpiredPasswordFilter extends Base {

    async beforeAction (action) {
        if (action.isAjax() || action.isPost()) {
            return;
        }
        const controller = action.controller;        
        const url = this.module.getParam('passwordChangeUrl');
        if (controller.user.isGuest() || !url) {
            return;
        }
        const service = this.spawn('security/PasswordAuthService');
        if (await service.isPasswordExpired(controller.user.getIdentity())) {
            controller.setFlash('info', 'auth.expiredPassword');
            return controller.redirect(url);
        }
    }
};