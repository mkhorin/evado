/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const Base = require('areto/view/Widget');

module.exports = class BaseMenu extends Base {

    async run () {
        const nav = this.module.getMeta('navigation');
        const section = nav.getSection('main', this.module.NAME);
        const activeItem = this.controller.metaData && this.controller.metaData.node;
        const openedItems = activeItem ? activeItem.getParents() : [];
        const items = openedItems.slice(0).concat(section.children);
        const forbiddenAccess = await this.getAccess({section, items}) || {};
        return this.renderTemplate('_part/nav/sidebar-menu', {
            section,
            forbiddenAccess,
            activeItem,            
            openedItems
        });
    }

    getAccess (data) {
        return this.module.get('rbac').getNavAccess(this.controller.user.assignments, data);
    }

    getItemUrl (item) {
        return item.data.url || `${this.getItemModule(item)}/model/?n=${item.id}`;
    }

    getItemModule (item) {
        return item.data.class ? 'office' : item.data.report ? 'report' : this.module.NAME;
    }

    isOriginalUrl (url) {
        return this.controller.getOriginalUrl() === url;
    }

    async renderItems (items) {
        return this.renderTemplate('_part/nav/sidebar-menu-items', {
            activeItem: null,
            openedItems: [],
            forbiddenAccess: await this.getAccess({items}) || {},
            items
        });
    }
};