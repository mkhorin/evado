/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

Jam.TreeMenu = class extends Jam.Element {

    constructor ($menu) {
        super($menu);
        this.$menu = $menu;
    }

    init () {
        this.setCurrentActive();
        this.$menu.on('click', '.treeview', this.onClickItem.bind(this));   
    }

    setCurrentActive () {
        const $active = this.$menu.find('.menu-item-btn').filter(function () {
            if (location.href.indexOf(this.href) !== 0) {
                return false;
            }
            const ch = location.href.charAt(this.href.length);
            return !ch || ch === '/' || ch === '?';
        });
        $active.first().parent().addClass('active').parents('.treeview').addClass('active');
    }

    onClickItem (event) {
        const $item = $(event.currentTarget);
        if (!$item.hasClass('menu-open')) {
            $item.children('.treeview-menu').find('.treeview-menu').slideUp();
        }
    }
};

Jam.LoadableTreeMenu = class extends Jam.TreeMenu {

    init () {
        super.init();
        this.$menu.on('click', '.treeview > a', this.onItemLink.bind(this));
    }

    onItemLink (event) {
        this.loadItem($(event.currentTarget).parent());
    }

    setCurrentActive () {
        return false;
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