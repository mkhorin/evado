/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
Jam.Cache = class Cache {

    constructor () {
        this.clear();
    }

    has (key) {
        return Object.hasOwn(this._data, key);
    }

    get (key, defaults) {
        return this.has(key) ? this._data[key] : defaults;
    }

    set (key, value) {
        this._data[key] = value;
    }

    unset (key) {
        delete this._data[key];
    }

    clear () {
        this._data = {};
    }
};