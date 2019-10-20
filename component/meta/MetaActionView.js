/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const Base = require('areto/view/ActionView');

module.exports = class MetaActionView extends Base {

    getViewModelClass (name) {
        const view = this.controller.metaData.view;
        if (!view) {
            return super.getViewModelClass(name);
        }
        let model = this.getViewOwnModelWithOrigin(view.viewModel);
        if (!model && view !== view.class) {
            model = this.getViewOwnModelWithOrigin(view.class.viewModel);
        }
        return model || super.getViewModelClass(name);
    }

    get (name) {
        const view = this.controller.metaData.view;
        if (!view) {
            return super.get(name);
        }
        let template = this.getMetaViewTemplate(view, name);
        if (!template && view !== view.class) {
            template = this.getMetaViewTemplate(view.class, name);
        }
        return super.get(template || name);
    }

    getMetaViewTemplate (view, name) {
        const template = this.getViewOwnTemplateWithOrigin(view.templateDir + name);
        return !template && view.parentTemplateDir
            ? this.getViewOwnTemplateWithOrigin(view.parentTemplateDir + name)
            : template;
    }

    getMetaItemTemplate (item) {
        let template = this.getViewOwnTemplate(item.templateKey);
        if (template) {
            return template;
        }
        if (item.parentTemplateKey) {
            template = this.getViewOwnTemplate(item.parentTemplateKey);
            if (template) {
                return template;
            }
        }
        if (item.parent) {
            return this.getMetaItemTemplate(item.parent);
        }
    }
};