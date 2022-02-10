/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
Jam.DeferredTask = class DeferredTask {

    constructor (handler, params) {
        this.handler = handler;
        this.params = params;
        this.processing = false;
    }

    process (cb) {
        if (!this.processing) {
            this.processing = true;
            this.handler(cb, this.params);
        }
    }
};