/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

Jam.ServerPolling = class ServerPolling {

    constructor () {
        this._tasks = [];
        this._refreshInterval = 30;
        $(document.body)
            .click(this.onUserAction.bind(this))
            .keyup(this.onUserAction.bind(this));
        this.executeStart(500);
        this._hasUserAction = true;
    }

    onUserAction () {
        this._hasUserAction = true;
        if (!this._timer) {
            this.refresh();
        }
    }

    add (data) {
        const task = new Jam.ServerPollingTask(data);
        this._tasks.push(task);
        return task;
    }

    delete (task) {
        const index = this._tasks.indexOf(task);
        if (index !== -1) {
            this._tasks.splice(index, 1);
        }
    }

    refresh () {
        for (const task of this._tasks) {
            task.refresh();
        }
        this.start();
    }

    stop () {
        if (this._timer) {
            clearTimeout(this._timer);
            this._timer = null;
        }
    }

    start () {
        this.stop();
        if (this._hasUserAction) {
            this.executeStart(this._refreshInterval * 1000);
        }
    }

    executeStart (delay) {
        this.stop();
        this._timer = setTimeout(this.refresh.bind(this), delay);
        this._hasUserAction = false;
    }
};

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
        if (this._xhr) {
            this._xhr.abort();
            this._xhr = null;
        }
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