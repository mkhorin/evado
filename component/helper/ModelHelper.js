/**
 * @copyright Copyright (c) 2020 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

module.exports = class ModelHelper {

    /**
     * @param {Array} rules - [[['createdAt', 'updatedAt'], 'timestamp']]
     * @param {Array} models
     * @param controller
     */
    static formatByRules (rules, models, controller) {
        if (!Array.isArray(rules)) {
            return false;
        }
        const formatter = controller.module.get('formatter');
        const formatMap = this.getFormatMap();
        for (const [attrs, type, params] of rules) {
            const format = formatMap[type] || this.formatDefaultRule;
            for (const model of models) {
                if (!Array.isArray(attrs)) {
                    format(attrs, model, formatter, type, params);
                    continue;
                }
                for (const attr of attrs) {
                    format(attr, model, formatter, type, params);
                }
            }
        }
    }

    static getFormatMap () {
        return {
        };
    }

    static getLabelSelectItems (attr, model) {
        const data = model.constructor.getAttrValueLabels(attr);
        return SelectHelper.getMapItems(data);
    }

    static formatDefaultRule (attr, model, formatter, type, params) {
        const value = model.get(attr);
        model.setViewAttr(attr, formatter.format(value, type, params));
    }

    static resolveFilterColumns (columns, model) {
        for (const column of columns) {
            if (column.label === undefined) {
                column.label = model.getAttrLabel(column.name);
            }
            if (column.items === 'labels') {
                column.items = this.getLabelSelectItems(column.name, model);
            }
            if (column.columns) {
                const relModel = model.getRelation(column.name).model;
                this.resolveFilterColumns(column.columns, relModel);
            }
        }
    }

    /**
     * Truncate old records to the offset if threshold is exceeded
     * @param query
     * @param threshold - minimum number of records before truncation
     * @param offset - number of records after truncation
     * @param {boolean} inBulk - delete records at once, otherwise by loading the models first
     */
    static async truncateOverflow ({query, threshold, offset, inBulk}) {
        const counter = await query.count();
        if (counter <= threshold) {
            return;
        }
        const {model} = query;
        query.order({[model.PK]: -1}).offset(offset);
        if (inBulk) {
            const ids = await query.ids();
            query.order(null).where({[model.PK]: ids});
            return query.delete();
        }
        const models = await query.all();
        return model.constructor.delete(models);
    }
};

const SelectHelper = require('./SelectHelper');