/**
 * @copyright Copyright (c) 2019 Maxim Khorin (maksimovichu@gmail.com)
 */
'use strict';

module.exports = class MetaHelper {

    static splitByPrefix (name, separator, prefixes) {
        if (typeof name !== 'string') {
            return;
        }
        const pos = name.indexOf(separator);
        if (pos !== -1) {
            let prefix = name.substring(0, pos);
            if (prefixes.includes(prefix)) {
                return [prefix, name.substring(pos + 1)];
            }
        }
    }

    // BUCKETS
    
    static createBuckets (models, key) {
        const buckets = {
            models: {},
            values: []
        };
        for (let model of models) {
            let value = model.get(key);
            if (value !== '' && value !== null && value !== undefined) {
                if (Array.isArray(value)) {
                    for (let val of value) {
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
        for (let doc of docs) {
            let value = doc[newKey];
            if (value !== '' && value !== null && value !== undefined) {
                if (Array.isArray(newDocs[value])) {
                    newDocs[value] = newDocs[value].concat(buckets.docs[doc[oldKey]]);
                } else {
                    newDocs[value] = buckets.docs[doc[oldKey]];
                    buckets.values.push(value);
                }
            }
        }
        buckets.docs = newDocs;
    }

    static setRowsToDocs (rows, docs, rowKey, docKey, valueKey) {
        const result = {};
        for (let row of rows) {
            let value = row[rowKey];
            if (Array.isArray(value)) {
                for (let val of value) {
                    if (Object.prototype.hasOwnProperty.call(docs, val)) {
                        if (Array.isArray(result[val])) {
                            result[val].push(Object.prototype.hasOwnProperty.call(row, valueKey) ? row[valueKey] : row);
                        } else {
                            result[val] = [Object.prototype.hasOwnProperty.call(row, valueKey) ? row[valueKey] : row];
                        }
                    }
                }
            } else if (value !== '' && value !== null && value !== undefined) {
                if (Array.isArray(result[value])) {
                    result[value].push(Object.prototype.hasOwnProperty.call(row, valueKey) ? row[valueKey] : row);
                } else {
                    result[value] = [Object.prototype.hasOwnProperty.call(row, valueKey) ? row[valueKey] : row];
                }
            }
        }
        for (let name of Object.keys(result)) {
            for (let doc of docs[name]) {
                doc[docKey] = Array.isArray(doc[docKey]) ? doc[docKey].concat(result[name]) : result[name];
            }
        }
    }

    static getModelValueList (models, attrs) {
        let values = [];
        for (let attr of attrs) {
            for (let model of models) {
                if (model._values[attr.name]) {
                    values = values.concat(model._values[attr.name]);
                }
            }
        }
        return values;
    }

    static setModelValueFromIndexedData (data, models, attrs) {
        for (let attr of attrs) {
            for (let model of models) {
                let value = model._values[attr.name];
                if (Array.isArray(value)) {
                    model._values[attr.name] = [];
                    for (let val of value) {
                        if (data[val]) {
                            model._values[attr.name].push(data[val]);
                        }
                    }
                } else if (value) {
                    model._values[attr.name] = data[value];
                }
            }
        }
    }

    static orderDocsByMap (docs, map, key) {
        if (map && Array.isArray(docs)) {
            docs.sort((a, b)=> {
                a = map[a[key]];
                b = map[b[key]];
                return a === undefined
                    ? (b === undefined ? 0 : 1)
                    : (b === undefined ? -1 : (a - b));
            });
        }
    }

    static orderModelsByMap (models, map) {
        if (map && Array.isArray(models)) {
            models.sort((a, b)=> {
                a = map[a.getId()];
                b = map[b.getId()];
                return a === undefined
                    ? (b === undefined ? 0 : 1)
                    : (b === undefined ? -1 : (a - b));
            });
        }
    }
};