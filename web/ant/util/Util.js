'use strict';

Ant.UtilManager = class {

    constructor ($container, owner) {
        this.owner = owner;
        this.$container = $container.find('.util-container');
        this.$container.data('utilManager', this);
        this.$menu = this.$container.children('.util-menu');
        this.$menu.find('.dropdown-toggle').one('click', this.loadMenu.bind(this));
    }

    loadMenu () {
        return $.get(this.$container.data('url')).done(this.createMenu.bind(this));
    }

    createMenu (data) {
        this.$menuContent = this.$menu.children('.dropdown-menu').empty();
        this.$pool = this.$container.children('.util-pool');
        this.$pool.html(data);
        this.$pool.children('.menu-item').each((index, element)=> this.createItem($(element)));
    }

    createItem ($item) {
        this.$menuContent.append($item.wrap('<li>').parent());
        let params = $item.data('params');
        let Class = params.class ? Ant.Util[params.class] : Ant.Util;
        return new Class($item, this, params);
    }
};

Ant.Util = class {

    constructor ($item, manager, params) {
        this.$item = $item;
        this.manager = manager;
        this.params = params;
        this.$item.click(this.onItemClick.bind(this));
    }

    onItemClick (event) {
        event.preventDefault();

        //$.post(this.params.url, {id: this.params.id});

    }


};