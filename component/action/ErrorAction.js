/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const Base = require('areto/base/Action');

module.exports = class ErrorAction extends Base {

    execute () {
        const controller = this.controller;
        const err = controller.err;
        if (!err) {
            return this.render(404);
        }
        controller.setHttpStatus(err.status);
        if (err.isServerError() || controller.module.get('logger').isDebug()) {
            controller.log('error', err);
        }
        if (controller.isAjax()) {
            return this.sendText(err.message, err.status);
        }
        if (err.status === 403 && controller.user.isGuest()) {
            return controller.user.loginRequired(controller);
        }
        if (controller.isPost()) {
            return this.sendText(err.message, err.status);
        }
        switch (err.status) {
            case 400:
            case 403:
            case 404:
                return this.render(err.status);
        }
        return this.render(500);
    }
};