/**
 * @copyright Copyright (c) 2021 Maxim Khorin <maksimovichu@gmail.com>
 */
Jam.NavTree = class NavTree extends Jam.Element {

    init () {
        this.params = this.getData('params');
        this.$element.prepend(this.createItems(this.params?.items));
        this.setCurrentActive();
        this.scrollToActive();
        this.$element.on('click', '.tree > .nav-link', this.onTreeLink.bind(this));
    }

    createItems (items) {
        return Array.isArray(items) ? items.map(this.createItem, this).join('') : '';
    }

    createItem (data) {
        data.children = this.createItems(data.children);
        data.label = Jam.t(data.label, data.t);
        const title = data.title ? Jam.t(data.title, data.t) : data.label;
        data.title = Jam.escape(title);
        const template = data.type || (data.children ? 'parent' : 'item');
        return this.resolveTemplate(template, data);
    }

    isContainerItem () {
        return !this.getItemUrl(...arguments);
    }

    getItemUrl () {
        return this.getItem(...arguments)
            .find('>.nav-link')
            .attr('href');
    }

    getItem (element) {
        return $(element).closest('.nav-item')
    }

    setCurrentActive () {
        const $item = this.getItem(this.getCurrentActive());
        $item.addClass('active');
        $item.parents('.nav-item').addClass('open has-active');
    }

    getCurrentActive () {
        return this.find('.nav-link')
            .filter(this.isCurrentItem, this)
            .first();
    }

    isCurrentItem (index, {href}) {
        if (location.href.indexOf(href) !== 0) {
            return false;
        }
        const chr = location.href.charAt(href.length);
        return !chr || chr === '/' || chr === '?';
    }

    scrollToActive () {
        const $active = this.getCurrentActive();
        if ($active.length) {
            const $container = this.$element.closest('aside');
            const top = $active.offset().top;
            const scroll = top - $container.height() / 2;
            if (scroll > 0) {
                $container.prop('scrollTop', scroll);
            }
        }
    }

    onTreeLink (event) {
        const $item = this.getItem(event.currentTarget);
        if (!this.getItemUrl($item) || $item.hasClass('active')) {
            event.preventDefault();
            $item.toggleClass('open');
            if (!$item.hasClass('open')) {
                $item.find('.open').removeClass('open');
            }
        }
    }
};