/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

module.exports = class SelectHelper {

    static DEFAULT_VALUE_KEY = '_id';
    static DEFAULT_TEXT_KEY = 'name';

    static getMapItems (map) {
        if (!map) {
            return [];
        }
        const items = [];
        for (const [value, text] of Object.entries(map)) {
            items.push({value, text});
        }
        return items;
    }

    // QUERY HANDLER

    static async handleQueryLabelItems (handler) {
        const items = await handler();
        return this.queryLabelItems(items);
    }

    static async handleQueryItems (handler, params) {
        const items = await handler();
        return this.queryLabelItems(items, params);
    }

    // QUERY

    static queryLabelItems (query) {
        return this.queryItems(query, {
            getItemText: this.getLabelText
        });
    }

    static async queryItems (query, params) {
        const items = await query.raw().all();
        return this.getItems(items, params);
    }

    // MODEL

    static getModelLabelItems (models) {
        return this.getModelItems(models, {
            getItemText: this.getLabelText
        });
    }

    static getModelItems (models, params) {
        models = models ? models.map(model => model.getAttrMap()) : [];
        return this.getItems(models, params);
    }

    // DOCS

    static getLabelItems (docs, params) {
        return this.getItems(docs, {
            getItemText: this.getLabelText,
            ...params
        });
    }

    static getItems (docs, params) {
        params = params || {};
        if (!params.valueKey) {
            params.valueKey = this.DEFAULT_VALUE_KEY;
        }
        if (!params.textKey) {
            params.textKey = this.DEFAULT_TEXT_KEY;
        }
        if (!params.getItemText) {
            params.getItemText = this.getItemText;
        }
        const items = [];
        if (Array.isArray(docs)) {
            for (const doc of docs) {
                const value = doc[params.valueKey];
                const text = params.getItemText.call(this, doc, params);
                items.push({value, text});
            }
        }
        return items;
    }

    static getLabelText ({label, name}) {
        return label ? `${label} (${name})` : name;
    }

    static getItemText (doc, params) {
        return doc[params.textKey] || doc[params.valueKey];
    }
};