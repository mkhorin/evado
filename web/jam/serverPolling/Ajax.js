/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
Jam.Ajax = class Ajax {

    constructor () {
        this._queue = [];
        this._current = null;
    }

    ajax () {
        return this.addRequest('ajax', ...arguments);
    }

    get () {
        return this.addRequest('get', ...arguments);
    }

    post () {
        return this.addRequest('post', ...arguments);
    }

    addRequest () {
        const request = new Jam.AjaxRequest(this, ...arguments);
        this._queue.push(request);
        if (!this._current) {
            this.processNext();
        }
        return request.deferred;
    }

    processNext () {
        this._current = this._queue.shift();
        if (this._current) {
            this._current.execute().always(this.processNext.bind(this));
        }
    }

    removeRequest (request) {
        const index = this._queue.indexOf(request);
        if (index !== -1) {
            this._queue.splice(index, 1);
        }
    }
};