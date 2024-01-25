/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const Base = require('areto/filter/ActionFilter');

module.exports = class ExpiredPasswordFilter extends Base {

    async beforeAction (action) {
        if (!this.module.params.enablePasswordChange) {
            return;
        }
        const {controller} = action;
        if (controller.isAjax()
            || controller.isPostRequest()
            || controller.user.isGuest()) {
            return;
        }
        const {changePasswordUrl} = this.module.params;
        if (!changePasswordUrl) {
            return;
        }
        const identity = controller.user.getIdentity();
        const service = this.spawn('security/PasswordAuthService');
        if (await service.isPasswordExpired(identity)) {
            controller.setFlash('info', 'auth.expiredPassword');
            return controller.redirect(changePasswordUrl);
        }
    }
};