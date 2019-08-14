/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const Base = require('areto/view/Widget');

module.exports = class GlobalMenu extends Base {

    run () {
        const items = this.items || this.getDefaultItems();
        return this.renderTemplate('_part/nav/global-menu', {items});
    }

    getDefaultItems () {
        const items = this.getModuleItems(this.module.app.modules);
        items.push(this.getSeparatorItem());
        items.push(this.getModuleItem(this.module.app));
        return items;
    }

    getModuleItems (modules) {
        return modules.map(this.getModuleItem.bind(this));
    }

    getModuleItem (module, config) {
        return {
            url: module.get('url').resolve(''),
            text: module.getTitle(),
            active: module === this.module,
            ...config
        };
    }

    getSeparatorItem () {
        return {
            name: 'separator'
        };
    }
};