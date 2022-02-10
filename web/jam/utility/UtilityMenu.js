/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
Jam.UtilityMenu = class UtilityMenu {

    constructor (manager) {
        this.manager = manager;
        this.items = manager.params.items;
        this.$container = manager.$container;
        this.init();
    }

    init () {
        this.$menu = this.$container.children('.utility-menu');
        // this.$menu.find('.dropdown-toggle').one('click', this.load.bind(this));
        this.$dropdown = this.$menu.children('.dropdown-menu');
        this.render();
    }

    render () {
        for (let i = 1; i < this.items.length; ++i) {
            const utility = this.renderItem('menuItem', this.items[i]);
            if (utility) {
                this.$dropdown.append(utility.$item);
            }
        }
        const utility = this.renderItem('button', this.items[0]);
        if (utility) {
            const $container = this.items.length > 1 ? this.$menu : this.$container;
            $container.prepend(utility.$item);
        }
        if (this.items.length > 1) {
            this.$menu.removeClass('hidden');
        }
        Jam.t(this.$container);
    }

    renderItem (template, data) {
        template = Jam.Helper.getTemplate(template, this.$container);
        data.css = data.css || 'btn-outline-primary';
        data.hint = data.hint || data.name;
        const $item = $(Jam.Helper.resolveTemplate(template, data));
        return this.manager.createUtility($item, data);
    }

    load () {
        return $.post(this.manager.url, this.manager.params)
            .done(this.createMenu.bind(this));
    }

    createMenu (data) {
        $(data).filter('.utility-item').each((index, element) => {
            this.createMenuItem($(element));
        });
        Jam.t(this.$container);
    }

    createMenuItem ($item) {
        const data = $item.data('params');
        const utility = this.manager.createUtility($item, data);
        if (utility) {
            this.appendMenuItem($item);
        }
    }

    appendMenuItem ($item) {
        this.$dropdown.append($item.addClass('dropdown-item'));
    }
};