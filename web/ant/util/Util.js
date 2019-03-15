'use strict';

Ant.Util = class {

};

Ant.UtilTools = class {

    constructor ($container) {
        this.$tools = $container.find('.util-tools');
        this.$pool = this.$tools.children('.util-pool');
        this.$menu = this.$tools.children('.util-menu');
        this.$tools.data('utilTools', this);
        this.createMenu();
        this.$tools.show();
    }

    createMenu () {
        let $list = this.$menu.children('.dropdown-menu');
        this.$pool.children('.menu-item').each(function () {
            $list.append($(this).wrap('<li>').parent());
        });
        this.$menu.toggle($list.children().length > 0);
    }

};