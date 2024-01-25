/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const Base = require('areto/view/Widget');

module.exports = class CommonMenu extends Base {

    execute () {
        const items = this.items || this.getDefaultItems();
        const {url} = this.controller.getQueryParams();
        const active = this.getActiveItem(items, url);
        return this.renderTemplate('_widget/commonMenu', {items, active});
    }

    getActiveItem (items, sourceUrl) {
        for (const item of items) {
            if (item.url) {
                const index = sourceUrl.indexOf(item.url);
                if (index === 0 || index === 1) {
                    return item;
                }
            }
        }
    }

    getDefaultItems () {
        const {app} = this.module;
        const items = [];
        for (const module of app.modules) {
            this.setModuleItem(module, this.modules?.[module.name], items);
        }
        this.setModuleItem(app, this.app, items);
        return items;
    }

    setModuleItem (module, params, items) {
        if (params?.hidden) {
            return;
        }
        if (params?.separated) {
            items.push(this.getSeparatorItem());
        }
        items.push({
            url: module.getRoute(),
            text: params?.title || module.getTitle()
        });
    }

    getSeparatorItem () {
        return {
            name: 'separator'
        };
    }
};