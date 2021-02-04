/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const Base = require('areto/view/Widget');

module.exports = class CommonMenu extends Base {

    execute () {
        const items = this.items || this.getDefaultItems();
        const active = this.getActiveItem(items, this.controller.getQueryParam('url'));
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
        let app = this.module.app;
        let items = [];
        let previous = null;
        for (const module of app.modules) {
            if (module.hidden) {
                continue;
            }
            if (previous?.getParam('separateNextCommonMenuItem')) {
                items.push(this.getSeparatorItem());
            }
            items.push(this.getModuleItem(module));
            previous = module;
        }
        items.push(this.getSeparatorItem());
        items.push(this.getModuleItem(app));
        return items;
    }

    getModuleItem (module, config) {
        const url = module.get('urlManager').resolve('');
        const text = module.getConfig('commonMenuTitle') || module.getTitle();
        return {url, text, ...config};
    }

    getSeparatorItem () {
        return {
            name: 'separator'
        };
    }
};