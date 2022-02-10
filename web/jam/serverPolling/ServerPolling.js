/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
Jam.ServerPolling = class ServerPolling {

    constructor (data = {}) {
        this._tasks = [];
        this._refreshInterval = data.refreshInterval || 30;
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
        clearTimeout(this._timer);
        this._timer = null;
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