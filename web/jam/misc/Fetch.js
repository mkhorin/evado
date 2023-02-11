/**
 * @copyright Copyright (c) 2021 Maxim Khorin <maksimovichu@gmail.com>
 */
Jam.Fetch = class Fetch {

    constructor () {
        this.createAbortController();
    }

    async getJson () {
        const res = await this.execute(...arguments);
        return res?.json();
    }

    async getText () {
        const res = await this.execute(...arguments);
        return res?.text();
    }

    async execute (url, data, options) {
        options = this.getOptions(data, options);
        const res = await fetch(url, options);
        if (res.status === 200) {
            return res;
        }
        await this.throwError(res);
    }

    isAborted () {
        return this.controller.signal.aborted;
    }

    abort () {
        this.controller.abort();
    }

    addAbortListener () {
        this.controller.signal.addEventListener('abort', ...arguments);
    }

    removeAbortListener (handler) {
        this.controller.signal.removeEventListener('abort', ...arguments);
    }

    createAbortController () {
        this.controller = new AbortController;
    }

    getOptions (data, options) {
        return {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data),
            signal: this.controller.signal,
            ...options
        };
    }

    async throwError (res) {
        const text = await res.text();
        throw new Error(text || res.statusText || res.status);
    }
};