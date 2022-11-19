/**
 * @copyright Copyright (c) 2021 Maxim Khorin <maksimovichu@gmail.com>
 */
Jam.Fetch = class Fetch {

    constructor () {
        this.createAbortController();
    }

    async getJson () {
        return (await this.execute(...arguments))?.json();
    }

    async getText () {
        return (await this.execute(...arguments))?.text();
    }

    async execute (url, data, options) {
        const res = await fetch(url, this.getOptions(data, options));
        return res.status !== 200
            ? this.throwError(res)
            : res;
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