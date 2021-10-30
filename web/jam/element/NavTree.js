/**
 * @copyright Copyright (c) 2021 Maxim Khorin <maksimovichu@gmail.com>
 */
Jam.NavTree = class NavTree extends Jam.Element {

    init () {
        this.params = this.getData('params');
        this.$element.prepend(this.createItems(this.params?.items));
        this.setCurrentActive();
        this.$element.on('click', '.tree > .nav-link', this.onTreeLink.bind(this));
    }

    createItems (items) {
        return Array.isArray(items) ? items.map(this.createItem, this).join('') : '';
    }

    createItem (data) {
        data.children = this.createItems(data.children);
        data.label = Jam.t(data.label, data.t);
        data.title = Jam.escape(data.title ? Jam.t(data.title, data.t) : data.label);
        const template = data.type || (data.children ? 'parent' : 'item');
        return this.resolveTemplate(template, data);
    }

    getItem (element) {
        return $(element).closest('.nav-item')
    }

    setCurrentActive () {
        const $item = this.getItem(this.getCurrentActive());
        $item.add($item.parents('.nav-item')).addClass('active open');
    }

    getCurrentActive () {
        return this.find('.nav-link').filter(this.isCurrentItem, this).first();
    }

    isCurrentItem (index, {href}) {
        if (location.href.indexOf(href) !== 0) {
            return false;
        }
        const chr = location.href.charAt(href.length);
        return !chr || chr === '/' || chr === '?';
    }

    onTreeLink (event) {
        event.preventDefault();
        const $item = this.getItem(event.currentTarget);
        $item.toggleClass('open');
        if (!$item.hasClass('open')) {
            $item.find('.open').removeClass('open');
        }
    }
};

Jam.LoadableNavTree = class LoadableNavTree extends Jam.NavTree {

    getCurrentActive () {
        return this.find('.active').last();
    }

    onTreeLink (event) {
        super.onTreeLink(event);
        this.loadItem(this.getItem(event.currentTarget));
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