/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
Jam.AjaxRequest = class AjaxRequest {

    constructor (ajax, method, ...args) {
        this.ajax = ajax;
        this.method = method;
        this.args = args;
        this.deferred = $.Deferred();
    }

    execute () {
        this.xhr = $[this.method](...this.args)
            .done(this.onDone.bind(this))
            .fail(this.onFail.bind(this));
        return this.xhr;
    }

    onDone () {
        this.deferred.done(...arguments);
    }

    onFail () {
        this.deferred.fail(...arguments);
    }
};