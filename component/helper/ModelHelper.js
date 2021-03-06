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
        model.setViewAttr(attr, formatter.format(model.get(attr), type, params));
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
                this.resolveFilterColumns(column.columns, model.getRelation(column.name).model);
            }
        }
    }

    static async truncateOverflow ({query, overflow, truncation, inBulk}) {
        if (await query.count() > overflow) {
            const model = query.model;
            query.order({[model.PK]: -1}).offset(truncation);
            if (inBulk) {
                const ids = await query.ids();
                return query.order(null).where({[model.PK]: ids}).delete();
            }
            return model.constructor.delete(await query.all());
        }
    }
};

const SelectHelper = require('./SelectHelper');