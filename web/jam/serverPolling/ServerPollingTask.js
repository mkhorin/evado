/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
Jam.ServerPollingTask = class ServerPollingTask {

    constructor (data) {
        this.period = data.period || 0;
        this.data = data;
        if (data.startup) {
            this._nextDate = new Date;
        } else {
            this.setNextDate();
        }
    }

    refresh () {
        if (this._nextDate && Date.now() >= this._nextDate) {
            this.execute();
        }
    }

    setNextDate () {
        if (this.period) {
            this._nextDate = Date.now() + this.period * 1000;
        }
    }

    stop () {
        this._xhr?.abort();
        this._xhr = null;
        this._nextDate = null;
    }

    start () {
        this.stop();
        this.setNextDate();
    }

    execute () {
        this.stop();
        this.setNextDate();

        const method = this.data.method || 'get';
        const url = this.getUrl();
        const data = this.getParams();
        const xhr = $.ajax({method, url, data});

        if (this.data.done) {
            xhr.done(this.data.done);
        }
        if (this.data.fail) {
            xhr.fail(this.data.fail);
        }
        if (this.data.always) {
            xhr.always(this.data.always)
        }
        this._xhr = xhr;
    }

    getUrl () {
        const url = this.data.url;
        return typeof url === 'function' ? url() : url;
    }

    getParams () {
        const params = this.data.params;
        return typeof params === 'function' ? params() : params;
    }
};