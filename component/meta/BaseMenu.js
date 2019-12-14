/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const Base = require('areto/view/Widget');

module.exports = class BaseMenu extends Base {

    async run () {
        const nav = this.module.getMeta('navigation');
        const section = nav.getSection('main', this.module.NAME);
        const activeItem = this.controller.meta && this.controller.meta.node;
        const openedItems = activeItem ? activeItem.getParents() : [];
        const items = openedItems.slice(0).concat(section.children);
        const forbiddenAccess = await this.resolveAccess({section, items}) || {};
        return this.renderTemplate('_part/nav/sidebarMenu', {
            section,
            forbiddenAccess,
            activeItem,            
            openedItems
        });
    }

    isOriginalUrl (url) {
        return this.controller.getOriginalUrl() === url;
    }

    getItemUrl (item) {
        return item.data.url || `${this.getItemModule(item)}/model/?n=${item.id}`;
    }

    getItemModule (item) {
        return item.data.class ? 'office' : item.data.report ? 'report' : this.module.NAME;
    }

    resolveAccess (data) {
        return this.module.getRbac().resolveNavAccess(this.controller.user.assignments, data);
    }

    async renderItems (items) {
        return this.renderTemplate('_part/nav/sidebarMenuItems', {
            activeItem: null,
            openedItems: [],
            forbiddenAccess: await this.resolveAccess({items}) || {},
            items
        });
    }
};