/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const Base = require('areto/base/Action');

module.exports = class ErrorAction extends Base {

    constructor (config) {
        super({
            serverErrorMessage: 'Something went wrong. We will work on fixing that right away',
            ...config
        })
    }

    execute () {
        const controller = this.controller;
        const err = controller.err;
        if (!err) {
            return this.render(404);
        }
        let message = err.message;
        if (err.isServerError()) {
            message = this.serverErrorMessage;
            controller.log('error', err);
        }
        if (controller.module.get('logger').isDebug()) {
            controller.log('error', err);
        }
        controller.setHttpStatus(err.status);
        if (controller.isAjax()) {
            return this.sendText(message);
        }
        if (err.status === 403 && controller.user.isGuest()) {
            return controller.user.loginRequired(controller);
        }
        if (controller.isPost()) {
            return this.sendText(message);
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