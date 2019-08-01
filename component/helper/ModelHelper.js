/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

module.exports = class ModelHelper {

    // rules: [[['createdAt', 'updatedAt'], 'timestamp']]
    // rules: [['user', 'relation', {url: 'user/update?id='}]]

    static formatByRules (rules, models, controller) {
        if (!Array.isArray(rules)) {
            return false;
        }
        const formatter = controller.module.get('formatter');
        const formatMap = this.getFormatMap();
        for (let [attrs, type, params] of rules) {
            let format = formatMap[type] || this.formatDefaultRule;
            for (let model of models) {
                if (Array.isArray(attrs)) {
                    for (let attr of attrs) {
                        format(model, attr, formatter, type, params);
                    }
                } else {
                    format(model, attrs, formatter, type, params);
                }
            }
        }
    }

    static getFormatMap () {
        return {
            relation: this.formatRelationRule
        };
    }

    static formatRelationRule (model, attr, formatter, type, {url} = {}) {
        const related = model.rel(attr);
        if (!related) {
            return model.setViewAttr(attr, model.get(attr));
        }
        if (!url) {
            return model.setViewAttr(attr, related.getTitle());
        }
        model.setViewAttr(attr, formatter.asModalLink(url + related.getId(), {
            text: related.getTitle()
        }));
    }

    static formatDefaultRule (model, attr, formatter, type, params) {
        model.setViewAttr(attr, formatter.format(model.get(attr), type, params));
    }
};