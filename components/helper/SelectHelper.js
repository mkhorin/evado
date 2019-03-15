'use strict';

const DEFAULT_VALUE_KEY = '_id';
const DEFAULT_TEXT_KEY = 'name';

module.exports = class SelectHelper {

    // MAP

    static getMapItems (map) {
        let items = [];
        if (map) {
            for (let key of Object.keys(map)) {
                items.push({
                    'value': key,
                    'text': map[key]
                });
            }
        }
        return items;
    }

    // QUERY HANDLER

    static async handleQueryCaptionItems (handler) {
        return this.queryCaptionItems(await handler());
    }

    static async handleQueryItems (handler, params) {
        return this.queryCaptionItems(await handler(), params);
    }

    // QUERY

    static queryCaptionItems (query) {
        return this.queryItems(query, {'getItemText': this.getCaptionText});
    }

    static async queryItems (query, params) {
        return this.getItems(await query.asRaw().all(), params);
    }

    // MODEL

    static getModelCaptionItems (models) {
        return this.getModelItems(models, {'getItemText': this.getCaptionText});
    }

    static getModelItems (models, params) {
        models = models ? models.map(model => model._attrs) : [];
        return this.getItems(models, params);
    }

    // DOCS

    static getCaptionItems (docs, params) {
        return this.getItems(docs, {
            'getItemText': this.getCaptionText,
            ...params
        });
    }

    static getItems (docs, params) {
        params = params || {};
        if (!params.valueKey) {
            params.valueKey = DEFAULT_VALUE_KEY;
        }
        if (!params.textKey) {
            params.textKey = DEFAULT_TEXT_KEY;
        }
        if (!params.getItemText) {
            params.getItemText = this.getItemText;
        }
        let items = [];
        if (docs instanceof Array) {
            for (let doc of docs) {
                items.push({
                    'value': doc[params.valueKey],
                    'text': params.getItemText.call(this, doc, params)
                });
            }
        }
        return items;
    }

    static getCaptionText (doc) {
        return doc.caption ? `${doc.caption} (${doc.name})` : doc.name;
    }

    static getItemText (doc, params) {
        return doc[params.textKey] || doc[params.valueKey];
    }
};