/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
Jam.ObjectHelper = class ObjectHelper {

    static has (key, data) {
        return data && Object.prototype.hasOwnProperty.call(data, key);
    }

    static push (value, key, data) {
        if (Array.isArray(data[key])) {
            data[key].push(value);
        } else {
            data[key] = [value];
        }
    }

    static getValues (object) {
        return object ? Object.values(object) : [];
    }

    static unsetKeys (object, keys) {
        for (const key of keys) {
            delete object[key];
        }
    }

    static getValueLabel (key, data) {
        return this.has(key, data) ? data[key] : key;
    }

    static assignUndefined (target, ...args) {
        for (const source of args) {
            if (source && typeof source === 'object') {
                for (const key of Object.keys(source)) {
                    if (!this.has(key, target)) {
                        target[key] = source[key];
                    }
                }
            }
        }
        return target;
    }

    static getNestedValue (key, data, defaults) {
        if (!data || typeof key !== 'string') {
            return defaults;
        }
        if (Object.prototype.hasOwnProperty.call(data, key)) {
            return data[key];
        }
        const pos = key.indexOf('.');
        if (pos > 0) {
            const targetKey = key.substring(0, pos);
            if (this.has(targetKey, data)) {
                key = key.substring(pos + 1);
                if (data[targetKey]) {
                    return this.getNestedValue(key, data[targetKey], defaults);
                }
            }
        }
        return defaults;
    }
};