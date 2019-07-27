/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

module.exports = class ModelHelper {

    // rules: [[['createdAt', 'updatedAt'], 'timestamp']],

    static formatByRules (rules, models, controller) {
        if (!Array.isArray(rules)) {
            return false;
        }
        let formatter = controller.module.get('formatter');
        let format = null;
        for (let [attrs, type, params] of rules) {
            switch (type) {
                case 'relation': format = this.formatRelationRule; break;
                default: format = this.formatDefaultRule;
            }
            for (let attr of attrs) {
                for (let model of models) {
                    format(model, attr, formatter, type, params);
                }
            }
        }
    }

    static formatRelationRule (model, attr, formatter, type, params = {}) {
        let related = model.rel(attr);
        if (!related) {
            return model.setViewAttr(attr, model.get(attr));
        }
        if (!params.url) {
            return model.setViewAttr(attr, related.getTitle());
        }
        model.setViewAttr(attr, formatter.asModalLink(params.url + related.getId(), {
            text: related.getTitle()
        }));
    }

    static formatDefaultRule (model, attr, formatter, type, params) {
        model.setViewAttr(attr, formatter.format(model.get(attr), type, params));
    }
};