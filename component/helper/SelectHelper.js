/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const DEFAULT_VALUE_KEY = '_id';
const DEFAULT_TEXT_KEY = 'name';

module.exports = class SelectHelper {

    static getMapItems (map) {
        const items = [];
        if (map) {
            for (const value of Object.keys(map)) {
                items.push({text: map[value], value});
            }
        }
        return items;
    }

    // QUERY HANDLER

    static async handleQueryLabelItems (handler) {
        return this.queryLabelItems(await handler());
    }

    static async handleQueryItems (handler, params) {
        return this.queryLabelItems(await handler(), params);
    }

    // QUERY

    static queryLabelItems (query) {
        return this.queryItems(query, {getItemText: this.getLabelText});
    }

    static async queryItems (query, params) {
        return this.getItems(await query.raw().all(), params);
    }

    // MODEL

    static getModelLabelItems (models) {
        return this.getModelItems(models, {getItemText: this.getLabelText});
    }

    static getModelItems (models, params) {
        models = models ? models.map(model => model.getAttrMap()) : [];
        return this.getItems(models, params);
    }

    // DOCS

    static getLabelItems (docs, params) {
        return this.getItems(docs, {getItemText: this.getLabelText, ...params});
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
        const items = [];
        if (Array.isArray(docs)) {
            for (const doc of docs) {
                items.push({
                    value: doc[params.valueKey],
                    text: params.getItemText.call(this, doc, params)
                });
            }
        }
        return items;
    }

    static getLabelText (doc) {
        return doc.label ? `${doc.label} (${doc.name})` : doc.name;
    }

    static getItemText (doc, params) {
        return doc[params.textKey] || doc[params.valueKey];
    }
};