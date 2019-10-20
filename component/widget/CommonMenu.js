/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const Base = require('areto/view/Widget');

module.exports = class CommonMenu extends Base {

    run () {
        const items = this.items || this.getDefaultItems();
        const active = this.getActiveItem(items, this.controller.getQueryParam('url'));
        return this.renderTemplate('_widget/common-menu', {items, active});
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
        const app = this.module.app;
        const items = [];
        for (const module of app.modules) {
            if (!module.hidden) {
                items.push(this.getModuleItem(module));
            }
        }
        items.push(this.getSeparatorItem());
        items.push(this.getModuleItem(app));
        return items;
    }

    getModuleItem (module, config) {
        return {
            url: module.get('urlManager').resolve(''),
            text: module.getTitle(),
            ...config
        };
    }

    getSeparatorItem () {
        return {
            name: 'separator'
        };
    }
};