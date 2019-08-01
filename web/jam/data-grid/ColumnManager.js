/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

Jam.DataGridColumnManager = class {

    constructor (grid) {
        this.grid = grid;
        this.params = grid.params;
        this.$container = grid.$container.find('.data-grid-column-manager');
        this.load();
        this.createMenu();

        this.$toggle = this.$container.find('.toggle');
        this.$toggle.click(this.onClickToggle.bind(this));

        $(document.body).click(this.onClickBody.bind(this));
    }

    createMenu () {
        const $body = this.$container.closest('.scroll-body');
        this.$menu = this.renderMenu();
        this.$menu.appendTo($body.length ? $body : document.body);
        this.$menu.on('change', 'input', this.onChangeItem.bind(this));
    }

    renderMenu () {
        let items = this.params.columns.map(this.createItem, this).join('');
        return $(`<div class="data-grid-column-manager-menu">${items}</div>`);
    }

    createItem ({label, name, hidden}) {
        label = this.grid.translate(label || name);
        let checked = hidden ? '' : 'checked';
        return `<label class="item-label" title="${name}"><input type="checkbox" ${checked} value="${name}">${label}</label>`;
    }

    isMenuActive () {
        return this.$menu.is(':visible');
    }

    onClickBody (event) {
        if (this.isMenuActive()) {
            let $target = $(event.target);
            if (!$target.closest(this.$toggle).length && !$target.closest(this.$menu).length) {
                this.hideMenu();
            }
        }
    }

    onClickToggle () {
       this.isMenuActive() ? this.hideMenu() : this.showMenu();
    }

    onChangeItem (event) {
        let $input = $(event.target).blur();
        this.grid.getColumn($input.val()).hidden = !$input.is(':checked');
        this.grid.drawTable();
        this.save();
    }

    hideMenu () {
        this.$menu.hide();
    }

    showMenu () {
        const offset = this.$toggle.offset();
        this.$menu.show().offset({
            left: offset.left + this.$toggle.outerWidth() - this.$menu.outerWidth(),
            top: offset.top + this.$toggle.outerHeight() + 1
        });

    }

    changeItem ($item) {
        const $checkbox = $item.find('input');
        const checked = !$checkbox.is(':checked');
        $checkbox.prop('checked', checked);
    }

    // STORE

    save () {
        store.set(this.getStoreKey(), this.getStoreData());
    }

    load () {
        const items = store.get(this.getStoreKey());
        if (this.checkStoreData(items)) {
            items.forEach((item, index)=> this.params.columns[index].hidden = item.hidden);
        }
    }

    checkStoreData (items) {
        return Array.isArray(items)
            ? Jam.ArrayHelper.equals(items.map(item => item.name), this.params.columns.map(item => item.name))
            : false;
    }


    getStoreKey () {
        return `column_manager_${this.params.id}`;
    }

    getStoreData () {
        return this.params.columns.map(data => ({
            name: data.name,
            hidden: data.hidden
        }));
    }
};