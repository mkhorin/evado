/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
Jam.Deferred = class Deferred {

    constructor () {
        this._tasks = [];
        this._proccessing = false;
    }

    add (task) {
        if (!(task instanceof Jam.DeferredTask)) {
            task = new Jam.DeferredTask(...arguments);
        }
        this._tasks.push(task);
        this.process();
    }

    process () {
        if (this._tasks.length) {
            this._tasks[0].process(this.done.bind(this));
        }
    }

    done () {
        this._tasks.shift();
        this.process();
    }
};