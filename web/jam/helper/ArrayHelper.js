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

    static intersectAll (...lists) {
        let result = lists[0];
        for (let i = 1; i < lists.length; ++i) {
            result = this.intersect(result, lists[i]);
        }
        return result;
    }

    static intersect (targets, sources) {
        const result = [];
        for (const target of targets) {
            if (sources.includes(target)) {
                result.push(target);
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
            values.push({
                [item[key]]: value !== undefined ? item[value] : item
            });
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

    static removeObjectsByKeyValue (key, value, items) {
        const removedObjects = [];
        for (let i = items.length - 1; i >= 0; --i) {
            if (items[i][key] === value) {
                removedObjects.push(...items.splice(i, 1));
            }
        }
        return removedObjects;
    }

    static removeObjectsByKeyValues (key, values, items) {
        const removedObjects = [];
        for (let i = items.length - 1; i >= 0; --i) {
            if (values.includes(items[i][key])) {
                removedObjects.push(...items.splice(i, 1));
            }
        }
        return removedObjects;
    }

    static replaceObjectByTarget (target, key, items) {
        for (let i = 0; i < items.length; ++i) {
            if (items[i][key] === target[key]) {
                return items.splice(i, 1, target)[0];
            }
        }
    }

    static random (items) {
        return items[Math.floor(Math.random() * items.length)];
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

    static sortByLength (lists, direction = 1) {
        return lists.sort(({length: a}, {length: b}) => (a - b) * direction);
    }
};