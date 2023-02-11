/**
 * @copyright Copyright (c) 2019 Maxim Khorin (maksimovichu@gmail.com)
 */
'use strict';

module.exports = class MetaHelper {

    static isSystemName (name) {
        return name?.charAt?.(0) === '_';
    }

    static createLabel ({data}) {
        if (!data.label) {
            data.label = StringHelper.generateLabel(data.name);
        }
        return data.label;
    }

    static addClosingChar (text, char) {
        if (typeof text === 'string') {
            if (text.length && text.slice(-1) !== char) {
                return text + char;
            }
        }
        return text;
    }

    static sortByOrderNumber (items) {
        return items.sort(this.compareByOrderNumber);
    }

    static compareByOrderNumber (a, b) {
        return a.orderNumber - b.orderNumber;
    }

    static sortByDataOrderNumber (items) {
        return items.sort(this.compareByDataOrderNumber);
    }

    static compareByDataOrderNumber (a, b) {
        return a.data.orderNumber - b.data.orderNumber;
    }

    static splitByPrefix (name, separator, prefixes) {
        if (typeof name === 'string') {
            const pos = name.indexOf(separator);
            if (pos !== -1) {
                const prefix = name.substring(0, pos);
                if (prefixes.includes(prefix)) {
                    return [prefix, name.substring(pos + 1)];
                }
            }
        }
    }

    // BUCKETS

    static createBuckets (models, key) {
        const buckets = {
            models: {},
            values: []
        };
        for (const model of models) {
            const value = model.get(key);
            if (value !== '' && value !== null && value !== undefined) {
                if (Array.isArray(value)) {
                    for (const val of value) {
                        if (value !== '' && value !== null) {
                            if (Array.isArray(buckets.models[val])) {
                                buckets.models[val].push(model);
                            } else {
                                buckets.models[val] = [model];
                                buckets.values.push(val);
                            }
                        }
                    }
                } else if (Array.isArray(buckets.models[value])) {
                    buckets.models[value].push(model);
                } else {
                    buckets.models[value] = [model];
                    buckets.values.push(value); // for preserve ObjectId
                }
            }
        }
        return buckets;
    }

    static rebuildBuckets (buckets, docs, newKey, oldKey) {
        buckets.values = [];
        const newDocs = {};
        for (const doc of docs) {
            const value = doc[newKey];
            if (value !== '' && value !== null && value !== undefined) {
                const oldValue = buckets.docs[doc[oldKey]];
                if (Array.isArray(newDocs[value])) {
                    newDocs[value] = newDocs[value].concat(oldValue);
                } else {
                    newDocs[value] = oldValue;
                    buckets.values.push(value);
                }
            }
        }
        buckets.docs = newDocs;
    }

    static setRowsToDocs (rows, docs, rowKey, docKey, valueKey) {
        const result = {};
        for (const row of rows) {
            const value = row[rowKey];
            const rowValue = Object.prototype.hasOwnProperty.call(row, valueKey)
                ? row[valueKey]
                : row;
            if (Array.isArray(value)) {
                for (const val of value) {
                    if (Object.prototype.hasOwnProperty.call(docs, val)) {
                        if (Array.isArray(result[val])) {
                            result[val].push(rowValue);
                        } else {
                            result[val] = [rowValue];
                        }
                    }
                }
            } else if (value !== '' && value !== null && value !== undefined) {
                if (Array.isArray(result[value])) {
                    result[value].push(rowValue);
                } else {
                    result[value] = [rowValue];
                }
            }
        }
        for (const name of Object.keys(result)) {
            for (const doc of docs[name]) {
                doc[docKey] = Array.isArray(doc[docKey])
                    ? doc[docKey].concat(result[name])
                    : result[name];
            }
        }
    }

    static getModelsValues (models, attrs) {
        const result = [];
        for (const model of models) {
            const values = this.getModelValues(model, attrs);
            result.push(...values);
        }
        return result;
    }

    static getModelValues (model, attrs) {
        const values = [];
        for (const attr of attrs) {
            const value = model.get(attr);
            if (value !== null && value !== undefined) {
                Array.isArray(value)
                    ? values.push(...value)
                    : values.push(value);
            }
        }
        return values;
    }

    static sortDocsByMap (docs, map, key) {
        if (map && Array.isArray(docs)) {
            docs.sort((a, b) => {
                a = map[a[key]];
                b = map[b[key]];
                return a === undefined
                    ? (b === undefined ? 0 : 1)
                    : (b === undefined ? -1 : (a - b));
            });
        }
    }

    static sortModelsByMap (models, map) {
        if (map && Array.isArray(models)) {
            models.sort((a, b) => {
                a = map[a.getId()];
                b = map[b.getId()];
                return a === undefined
                    ? (b === undefined ? 0 : 1)
                    : (b === undefined ? -1 : (a - b));
            });
        }
    }
};

const StringHelper = require('areto/helper/StringHelper');