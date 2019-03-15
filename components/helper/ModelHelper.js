'use strict';

module.exports = class ModelHelper {

    // 'rules': [[['createdAt', 'updatedAt'], 'timestamp']],

    static formatByRules (rules, models, controller) {
        if (!(rules instanceof Array)) {
            return false;
        }
        let formatter = controller.module.get('formatter'), format;
        for (let rule of rules) {
            switch (rule[1]) {
                case 'relation': format = this.formatRelationRule; break;
                default: format = this.formatDefaultRule;
            }
            for (let name of rule[0]) {
                for (let model of models) {
                    format(model, name, rule, formatter);
                }
            }
        }
    }

    static formatRelationRule (model, name, rule, formatter) {
        let rel = model.rel(name);
        rel = rel ? rel.getTitle() : null;
        model.setViewAttr(name, formatter.asRaw(rel));
    }

    static formatDefaultRule (model, name, rule, formatter) {
        model.setViewAttr(name, formatter.format(model.get(name), rule[1], rule[2]));
    }
};