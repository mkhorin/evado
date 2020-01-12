/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

module.exports = class ModelHelper {

    static escapeValue (value) {
        return typeof value === 'string'
            ? value.replace(/</g, '&lt;').replace(/>/g, '&gt;')
            : value;
    }

    // rules: [[['createdAt', 'updatedAt'], 'timestamp']]

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

    static formatDefaultRule (attr, model, formatter, type, params) {
        model.setViewAttr(attr, formatter.format(model.get(attr), type, params));
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