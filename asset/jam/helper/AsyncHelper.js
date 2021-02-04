/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
Jam.AsyncHelper = class AsyncHelper {

    static promise (callback) {
        return new Promise((resolve, reject) => {
            callback((err, result) => err ? reject(err) : resolve(result));
        });
    }

    static each (items, handler, callback) {
        if (!Array.isArray(items) || !items.length) {
            return callback();
        }
        (new this({items, handler, callback, counter: 0})).each();
    }

    static series (items, callback) {
        const result = Array.isArray(items) ? [] : {};
        if (!items) {
            return callback(null, result);
        }
        const keys = Object.keys(items);
        if (!keys.length) {
            return callback(null, result);
        }
        (new this({items, callback, keys, result})).series();
    }

    static eachSeries (items, handler, callback) {
        if (!Array.isArray(items) || !items.length) {
            return callback();
        }
        (new this({items, handler, callback})).eachSeries();
    }

    static eachOfSeries (items, handler, callback) {
        if (!items) {
            return callback();
        }
        const keys = Object.keys(items);
        if (!keys.length) {
            return callback();
        }
        (new this({items, handler, callback, keys})).eachOfSeries();
    }

    static mapSeries (items, handler, callback) {
        const result = [];
        if (!Array.isArray(items) || !items.length) {
            return callback(null, result);
        }
        (new this({items, handler, callback, result})).mapSeries();
    }

    constructor (config) {
        Object.assign(this, config);
    }

    each () {
        const process = err => {
            if (err || ++this.counter === this.items.length) {
                this.callback(err);
            }
        };
        for (const item of this.items) {
            this.handler(item, process);
        }
    }

    series (pos = 0) {
        this.items[this.keys[pos]]((err, value) => {
            if (err) {
                return this.callback(err);
            }
            this.result[this.keys[pos]] = value;
            if (++pos === this.keys.length) {
                return this.callback(null, this.result);
            }
            this.series(pos);
        });
    }

    eachSeries (pos = 0) {
        this.handler(this.items[pos], err => {
            if (err) {
                return this.callback(err);
            }
            if (++pos === this.items.length) {
                return this.callback();
            }
            this.eachSeries(pos);
        });
    }

    eachOfSeries (pos = 0) {
        this.handler(this.items[this.keys[pos]], this.keys[pos], err => {
            if (err) {
                return this.callback(err);
            }
            if (++pos === this.keys.length) {
                return this.callback();
            }
            this.eachOfSeries(pos);
        });
    }

    mapSeries (pos = 0) {
        this.handler(this.items[pos], (err, value) => {
            if (err) {
                return this.callback(err);
            }
            this.result.push(value);
            if (++pos === this.items.length) {
                return this.callback(null, this.result);
            }
            this.mapSeries(pos);
        });
    }
};