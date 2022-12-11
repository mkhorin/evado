/**
 * @copyright Copyright (c) 2021 Maxim Khorin <maksimovichu@gmail.com>
 */
Jam.LoadableNavTree = class LoadableNavTree extends Jam.NavTree {

    getCurrentActive () {
        return this.find('.active').last();
    }

    onTreeLink (event) {
        super.onTreeLink(event);
        const $item = this.getItem(event.currentTarget);
        if (this.isContainerItem($item)) {
            this.loadItem($item);
        }
    }

    loadItem ($item) {
        if ($item.hasClass('loading') || $item.hasClass('loaded')) {
            return false;
        }
        $item.addClass('loading');
        const url = this.getData('url');
        const id = $item.data('id');
        return $.get(url, {id})
            .done(this.onDone.bind(this, $item))
            .always(this.onAlways.bind(this, $item));
    }

    onDone ($item, data) {
        const $children = $item.find('.nav-children');
        $children.html(data);
        Jam.t($children);
    }

    onAlways ($item) {
        $item.removeClass('loading').addClass('loaded');
    }
};