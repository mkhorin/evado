/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

Jam.UtilityManager = class UtilityManager extends Jam.Element {

    init () {
        this.$container = this.$element;
        this.params = this.$container.data('params') || {};
        this.url = this.$container.data('url');
        this.menu = new (this.getMenuClass())(this);
    }

    getMenuClass () {
        switch (this.params.menu) {
            case 'bar': return Jam.UtilityBar;
        }
        return Jam.UtilityMenu;
    }

    getRequestData () {
        return {
            action: this.params.action,
            meta: this.params.meta,
            model: this.params.model
        };
    }

    getUtilityClass ({frontClass}) {
        const Class = frontClass ? Jam.Utility[frontClass] : Jam.Utility;
        if (Class && typeof Class === 'function' && Jam.Utility.hasOwnProperty(frontClass)) {
            return Class;
        }
        console.error('Invalid utility class:', frontClass);
    }

    createUtility ($item, data) {
        const Class = this.getUtilityClass(data);
        if (Class) {
            return new Class($item, this, data);
        }
    }
};

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
        Jam.i18n.translateContainer(this.$container);
    }

    renderItem (template, data) {
        template = Jam.Helper.getTemplate(template, this.$container);
        data.css = data.css || 'btn-default';
        data.hint = data.hint || data.name;
        const $item = $(Jam.Helper.resolveTemplate(template, data));
        return this.manager.createUtility($item, data);
    }

    load () {
        return $.post(this.manager.url, this.manager.params).done(this.createMenu.bind(this));
    }

    createMenu (data) {
        $(data).filter('.utility-item').each((index, element) => this.createMenuItem($(element)));
        Jam.i18n.translateContainer(this.$container);
    }

    createMenuItem ($item) {
        const data = $item.data('params');
        const utility = this.manager.createUtility($item, data);
        if (utility) {
            this.appendMenuItem($item);
        }
    }

    appendMenuItem ($item) {
        this.$dropdown.append($item.wrap('<li>').parent());
    }
};

Jam.UtilityBar = class UtilityBar extends Jam.UtilityMenu {

    init () {
        for (const item of this.items) {
            const utility = this.renderItem('button', item);
            if (utility) {
                this.$container.append(utility.$item);
            }
        }
    }
};

Jam.Utility = class Utility {

    constructor ($item, manager, params) {
        this.$item = $item;
        this.manager = manager;
        this.params = params;
        this.modal = Jam.modalStack.getFrame(manager.$container);
        this.$item.click(this.onItem.bind(this));
    }

    getList () {
        return Jam.Element.getInstance(this.manager.$container.closest('.data-grid'));
    }

    getModel () {
        return this.modal && this.modal.findInstanceByClass(Jam.Model);
    }

    getUrl () {
        return this.manager.url;
    }

    getRequestData (data) {
        return {
            id: this.params.id,
            ...this.manager.getRequestData(),
            ...data
        };
    }

    onItem (event) {
        event.preventDefault();
        this.confirm().then(this.execute.bind(this));
    }

    checkModelChanged () {
        if (this.getModel().isChanged()) {
            return Jam.dialog.alert('Save changes first');
        }
    }

    confirm () {
        return this.params.confirmation
            ? Jam.dialog.confirm(this.params.confirmation)
            : $.Deferred().resolve();
    }

    execute () {
        // override utility actions
    }

    parseModelError (data) {
        this.getModel().error.parseXhr(data);
    }
};