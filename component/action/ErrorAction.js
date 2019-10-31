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
        controller.log('error', err);
        const status = err.status;
        controller.setHttpStatus(status);
        const message = err.isServerError() ? this.serverErrorMessage : err.message;
        if (controller.isAjax()) {
            return this.sendText(message);
        }
        if (status === 403 && this.isAuthRedirect()) {
            return true;
        }
        /*
        if (controller.isPost()) {
            return this.sendText(message);
        } //*/
        switch (status) {
            case 400:
            case 403:
            case 404:
                return this.render(status);
        }
        return this.render(500);
    }

    isAuthRedirect () {
        const user = this.controller.user; 
        if (!user.isGuest()) {
            return false;
        }
        user.setReturnUrl(this.controller.getOriginalUrl());
        const url = user.getLoginUrl();
        if (url) {
            this.controller.redirect(url);
            return true;
        }
    }
};