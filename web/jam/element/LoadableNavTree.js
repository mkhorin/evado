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
        const id = $item.data('id');
        return $.get(this.getData('url'), {id})
            .done(data => Jam.t($item.find('.nav-children').html(data)))
            .always(() => $item.removeClass('loading').addClass('loaded'));
    }
};