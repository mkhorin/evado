/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
Jam.ArrayHelper = class ArrayHelper {

    static normalize (data) {
        if (Array.isArray(data)) {
            return data;
        }
        return data === null && data === undefined ? [] : [data];
    }

    static equals (a, b) {
        if (!Array.isArray(a) || !Array.isArray(b) || a.length !== b.length) {
            return false;
        }
        for (let i = 0; i < a.length; ++i) {
            if (a[i] !== b[i]) {
                return false;
            }
        }
        return true;
    }

    static exclude (targets, sources) {
        return sources.filter(item => !targets.includes(item));
    }

    static flip (items) {
        const data = {};
        if (Array.isArray(items)) {
            for (let i = 0; i < items.length; ++i) {
                data[items[i]] = i;
            }
        }
        return data;
    }

    static index (key, items) {
        const data = {};
        if (Array.isArray(items)) {
            for (const item of items) {
                if (item) {
                    data[item[key]] = item;
                }
            }
        }
        return data;
    }

    static indexArrays (key, items) {
        const data = {};
        if (Array.isArray(items)) {
            for (const item of items) {
                if (item) {
                    if (Array.isArray(data[item[key]])) {
                        data[item[key]].push(item);
                    } else {
                        data[item[key]] = [item];
                    }
                }
            }
        }
        return data;
    }

    static intersect (items, targets) {
        const result = [];
        for (const item of items) {
            for (const target of targets) {
                if (item === target) {
                    result.push(item);
                    break;
                }
            }
        }
        return result;
    }

    /**
     * Get [{key: value}, ...] from object array
     */
    static mapValueByKey (key, items, value) {
        const values = [];
        for (const item of items) {
            values.push({[item[key]]: value !== undefined ? item[value] : item});
        }
        return values;
    }

    static remove (value, values) {
        value = values.indexOf(value);
        if (value === -1) {
            return false;
        }
        values.splice(value, 1);
        return true;
    }

    static removeObjectsByKeyValues (key, values, items) {
        for (let i = items.length - 1; i >= 0; --i) {
            if (values.includes(items[i][key])) {
                items.splice(i, 1);
            }
        }
    }

    static replaceObjectByTarget (target, key, items) {
        for (let i = 0; i < items.length; ++i) {
            if (items[i][key] === target[key]) {
                items.splice(i, 1, target);
                return;
            }
        }
    }

    static random (items) {
        return items.length ? items[Math.floor(Math.random() * items.length)] : null;
    }

    static shuffle (items) {
        let i = items.length;
        while (i) {
            const j = Math.floor((i--) * Math.random());
            const temp = items[i];
            items[i] = items[j];
            items[j] = temp;
        }
        return items;
    }

    static unique (items) {
        return items.filter((item, index) => items.indexOf(item) === index);
    }

    static uniqueByKey (key, items) {
        const data = {}, result = [];
        for (const item of items) {
            if (!Object.prototype.hasOwnProperty.call(data, item[key])) {
                data[item[key]] = item;
                result.push(item);
            }
        }
        return result;
    }

    static getByNestedValue (value, key, items) {
        return items?.[this.searchByNestedValue(value, key, items)];
    }

    static searchByNestedValue (value, key, items) {
        if (Array.isArray(items)) {
            for (let i = 0; i < items.length; ++i) {
                if (Jam.ObjectHelper.getNestedValue(key, items[i]) === value) {
                    return i;
                }
            }
        }
        return -1;
    }
};