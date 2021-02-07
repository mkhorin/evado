/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const Base = require('areto/view/Widget');

module.exports = class BaseMenu extends Base {

    async execute () {
        const nav = this.module.getMeta('navigation');
        const section = nav.getSection('main', this.module.getRouteName());
        const activeItem = this.controller.meta?.node;
        const openedItems = activeItem?.getParents() || [];
        const items = [...openedItems, ...section.children];
        const forbiddenAccess = await this.resolveAccess({section, items});
        return this.renderTemplate('_part/nav/sideMenu', {
            section,
            activeItem,            
            openedItems,
            forbiddenAccess
        });
    }

    isOriginalUrl (url) {
        return this.controller.getOriginalUrl() === url;
    }

    getItemUrl (item) {
        return item.data.url || `${this.getItemModule(item)}/model/?n=${item.id}`;
    }

    getItemModule (item) {
        return item.data.class ? 'office' : item.data.report ? 'report' : this.module.getRouteName();
    }

    resolveAccess (data) {
        return this.module.getRbac().resolveNavAccess(this.controller.user.assignments, data, {
            controller: this.controller
        });
    }

    async renderItems (items, section) {
        return this.renderTemplate('_part/nav/sideMenuItems', {
            activeItem: null,
            openedItems: [],
            forbiddenAccess: await this.resolveAccess({section, items}),
            items
        });
    }
};