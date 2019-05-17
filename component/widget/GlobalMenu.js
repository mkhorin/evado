'use strict';

const Base = require('areto/view/Widget');

module.exports = class GlobalMenu extends Base {

    run () {
        let items = this.items || this.getDefaultItems();
        return this.renderTemplate('_part/nav/global-menu', {items});
    }

    getDefaultItems () {
        let items = this.getModuleItems(this.module.app.modules);
        items.push(this.getSeparatorItem());
        items.push(this.getModuleItem(this.module.app));
        return items;
    }

    getModuleItems (modules) {
        return modules.map(this.getModuleItem.bind(this));
    }

    getModuleItem (module) {
        return {
            url: module.get('url').resolve(''),
            text: module.getTitle(),
            active: module === this.module
        };
    }

    getSeparatorItem () {
        return {
            name: 'separator'
        };
    }
};