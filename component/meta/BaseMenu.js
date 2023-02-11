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
        const items = [...section.children];
        if (activeItem) {
            items.push(...activeItem.getParentsChildren());
            if (activeItem.children) {
                items.push(...activeItem.children);
            }
        }
        const forbiddenAccess = await this.resolveAccess({items, section});
        const dynamicItems = await this.getDynamicItems(items, section);
        return this.renderTemplate('_part/nav/sideMenu', {
            section,
            activeItem,
            openedItems,
            forbiddenAccess,
            dynamicItems
        });
    }

    isOriginalUrl (url) {
        return this.controller.getOriginalUrl() === url;
    }

    getItemUrl (item) {
        if (item.data.url) {
            return item.data.url;
        }
        const params = item.serializeUrlParams();
        return `${this.getItemModule(item)}/model/?n=${item.id}${params}`;
    }

    getItemModule (item) {
        if (item.data.class) {
            return 'office';
        }
        if (item.data.report) {
            return 'report';
        }
        return this.module.getRouteName();
    }

    getDynamicItems (items, section) {
        return section.getDynamicNodes(items, {
            controller: this.controller
        });
    }

    resolveAccess (data, params) {
        return this.module.getRbac().resolveNavAccess(this.controller.user.assignments, data, {
            controller: this.controller,
            ...params
        });
    }

    async renderItems (items, section) {
        const forbiddenAccess = await this.resolveAccess({items, section}, {
            withParents: true
        });
        const dynamicItems = await this.getDynamicItems(items, section);
        const params = this.view.getRenderParams({
            activeItem: null,
            openedItems: [],
            forbiddenAccess,
            dynamicItems,
            items
        });
        return this.renderTemplate('_part/nav/sideMenuItems', params);
    }
};