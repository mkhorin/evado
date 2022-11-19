/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const Base = require('areto/base/Action');

module.exports = class ErrorAction extends Base {

    constructor (config) {
        super({
            ajax: config.controller.isAjax(),
            serverErrorMessage: 'Something went wrong. Internal server error',
            ...config
        })
    }

    execute () {
        const controller = this.controller;
        const err = controller.err;
        if (!err) {
            return this.render(Response.NOT_FOUND);
        }
        controller.log('error', err);
        const status = err.status;
        controller.setHttpStatus(status);
        const message = err.isServerError()
            ? this.serverErrorMessage
            : err.message;
        if (this.ajax) {
            return this.sendText(message);
        }
        if (status === Response.FORBIDDEN && this.isAuthRedirect()) {
            return true;
        }
        switch (status) {
            case Response.BAD_REQUEST:
            case Response.FORBIDDEN:
            case Response.NOT_FOUND:
                return this.render(status);
        }
        return this.render(Response.INTERNAL_SERVER_ERROR);
    }

    isAuthRedirect () {
        if (!this.user.isGuest()) {
            return false;
        }
        this.user.setReturnUrl(this.controller.getOriginalUrl());
        const url = this.user.getLoginUrl();
        if (url) {
            this.controller.redirect(url);
            return true;
        }
    }
};

const Response = require('areto/web/Response');