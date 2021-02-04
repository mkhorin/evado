/**
 * @copyright Copyright (c) 2021 Maxim Khorin <maksimovichu@gmail.com>
 */
Jam.NavTree = class NavTree extends Jam.Element {

    init () {
        this.setCurrentActive();
        this.$element.on('click', '.tree > .nav-link', this.onItem.bind(this));
    }

    setCurrentActive () {
        const $item = this.getCurrentActive().closest('.nav-item');
        $item.add($item.parents('.nav-item')).addClass('active open');
    }

    getCurrentActive ($item) {
        return this.find('.nav-link').filter(this.isCurrentItem, this).first();
    }

    isCurrentItem (index, {href}) {
        if (location.href.indexOf(href) !== 0) {
            return false;
        }
        const chr = location.href.charAt(href.length);
        return !chr || chr === '/' || chr === '?';
    }

    onItem (event) {
        const $item = $(event.currentTarget).parent();
        $item.toggleClass('open');
        if (!$item.hasClass('open')) {
            $item.find('.open').removeClass('open');
        }
    }
};

Jam.LoadableNavTree = class LoadableNavTree extends Jam.NavTree {

    init () {
        super.init();
        this.$element.on('click', '.tree > .nav-link', this.onLink.bind(this));
    }

    getCurrentActive ($item) {
        return this.find('.active').last();
    }

    onLink (event) {
        event.preventDefault();
        this.loadItem($(event.currentTarget).closest('.nav-item'));
    }

    loadItem ($item) {
        if ($item.hasClass('loading') || $item.hasClass('loaded')) {
            return false;
        }
        $item.addClass('loading');
        const id = $item.data('id');
        return $.get(this.getData('url'), {id})
            .done(data => Jam.t($item.find('.nav-children').html(data)))
            .always(() => $item.removeClass('loading').addClass('loaded'));
    }
};