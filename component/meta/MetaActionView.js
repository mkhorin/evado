/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const Base = require('areto/view/ActionView');

module.exports = class MetaActionView extends Base {

    static getConstants () {
        return {
            ModelHelper: require('../helper/ModelHelper')
        };
    }

    getViewModelClass (name) {
        const view = this.controller.meta.view;
        if (!view) {
            return super.getViewModelClass(name);
        }
        let model = this.getModelFromOriginalOrSameView(view.viewModel);
        if (!model && view !== view.class) {
            model = this.getModelFromOriginalOrSameView(view.class.viewModel);
        }
        return model || super.getViewModelClass(name);
    }

    get (name) {
        const view = this.controller.meta.view;
        if (!view) {
            return super.get(name);
        }
        let template = this.getMetadataViewTemplate(view, name);
        if (!template && view !== view.class) {
            template = this.getMetadataViewTemplate(view.class, name);
        }
        return super.get(template || name);
    }

    getMetadataViewTemplate (view, name) {
        const template = this.getTemplateFromOriginalOrSameView(view.templateDir + name);
        return !template && view.parentTemplateDir
            ? this.getTemplateFromOriginalOrSameView(view.parentTemplateDir + name)
            : template;
    }

    getMetaItemTemplate (item) {
        let template = this.getTemplateFromSameView(item.templateKey);
        if (template) {
            return template;
        }
        if (item.parentTemplateKey) {
            template = this.getTemplateFromSameView(item.parentTemplateKey);
            if (template) {
                return template;
            }
        }
        if (item.parent) {
            return this.getMetaItemTemplate(item.parent);
        }
    }
};
module.exports.init();