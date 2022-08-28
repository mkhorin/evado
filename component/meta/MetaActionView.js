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

    getViewModelClass () {
        const view = this.controller.meta.view;
        if (!view) {
            return super.getViewModelClass(...arguments);
        }
        if (view === view.class) {
            return this.getModelFromOriginalOrSameView(`_class/${view.name}`)
                || super.getViewModelClass(...arguments);
        }
        return this.getModelFromOriginalOrSameView(`_view/${view.class.name}/${view.name}`)
            || this.getModelFromOriginalOrSameView(`_class/${view.class.name}`)
            || super.getViewModelClass(...arguments);
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
        return template || super.get(name);
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