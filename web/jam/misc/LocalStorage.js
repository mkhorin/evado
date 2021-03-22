/**
 * @copyright Copyright (c) 2021 Maxim Khorin <maksimovichu@gmail.com>
 */
Jam.LocalStorage = class LocalStorage {

    constructor (storage = window.localStorage) {
        this.storage = storage;
    }

    has (key) {
        return typeof this.storage.getItem(key) === 'string';
    }

    get (key, defaults) {
        const value = this.storage.getItem(key);
        return typeof value === 'string'
            ? this.parse(this.storage.getItem(key))
            : defaults;
    }

    set (key, value) {
        value !== undefined
            ? this.storage.setItem(key, this.stringify(value))
            : this.remove(key);
    }

    stringify (value) {
        return JSON.stringify(value);
    }

    parse (value) {
        return JSON.parse(value);
    }

    remove (key) {
        this.storage.removeItem(key);
    }

    clear () {
        this.storage.clear();
    }
};