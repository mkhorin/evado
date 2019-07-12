/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

Jam.TreeMenu = class extends Jam.Element {

    constructor ($menu) {
        super($menu);
        this.$menu = $menu;         
        this.init();
    }

    init () {
        this.setCurrentActive();
        this.$menu.on('click', '.treeview', this.onClickItem.bind(this));   
    }

    setCurrentActive () {
        let $active = this.$menu.find('.menu-item-btn').filter(function () {
            return this.href === location.href;
        });
        $active.first().parent().addClass('active').parents('.treeview').addClass('active');
    }

    onClickItem (event) {
        let $item = $(event.currentTarget);
        if (!$item.hasClass('menu-open')) {
            $item.children('.treeview-menu').find('.treeview-menu').slideUp();
        }
    }
};

Jam.LoadableTreeMenu = class extends Jam.TreeMenu {

    init () {
        super.init();
        this.$menu.on('click', '.treeview > a', this.onClickItemLink.bind(this));
    }

    setCurrentActive () {
        return false;
    }

    onClickItemLink (event) {
        this.loadItem($(event.currentTarget).parent());
    }

    loadItem ($item) {
        if ($item.hasClass('loading') || $item.hasClass('loaded')) {
            return false;
        }
        $item.addClass('loading');
        $.get(this.$menu.data('url'), {
            id: $item.data('id')
        }).done(data => {
            $item.find('.treeview-menu').html(data);
        }).always(()=> {
            $item.removeClass('loading').addClass('loaded');
        });
    }
};