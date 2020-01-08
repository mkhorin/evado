/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

Jam.UtilityManager = class UtilityManager {

    constructor ($container, owner) {
        this.owner = owner;
        this.$container = $container.find('.utility-container');
        this.$container.data('utilityManager', this);
        this.params = this.$container.data('params');
        this.$menu = this.$container.children('.utility-menu');
        this.$menu.find('.dropdown-toggle').one('click', this.loadMenu.bind(this));
    }

    loadMenu () {
        return $.post(this.$container.data('url'), this.params)
            .done(this.createMenu.bind(this));
    }

    createMenu (data) {
        this.$menuContent = this.$menu.children('.dropdown-menu').empty();
        this.$pool = this.$container.children('.utility-pool');
        this.$pool.html(data);
        Jam.i18n.translateContainer(this.$pool);
        this.$pool.children('.menu-item').each((index, element) => this.createItem($(element)));
    }

    createItem ($item) {
        this.$menuContent.append($item.wrap('<li>').parent());
        const params = $item.data('params');
        const Class = params.frontClass ? Jam.Utility[params.frontClass] : Jam.Utility;
        return new Class($item, this, params);
    }
};

Jam.Utility = class Utility {

    constructor ($item, manager, params) {
        this.$item = $item;
        this.manager = manager;
        this.params = params;
        this.$item.click(this.onItemClick.bind(this));
    }

    getModal () {
        return this.manager.owner.modal;
    }

    getOwner () {
        return this.manager.owner;
    }

    getRequestData (data) {
        return {
            id: this.params.id,
            ...this.manager.params,
            ...data
        };
    }

    onItemClick (event) {
        event.preventDefault();
    }
};