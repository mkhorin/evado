'use strict';

Ant.DataGrid.ColumnManager = class {

    constructor (grid) {
        this.grid = grid;
        this.params = grid.params;
        this.$container = grid.$container.find('.data-grid-column-manager');

        this.load();
        this.$menu = this.createMenu();
        this.$menu.appendTo(document.body);
        this.$menu.on('change', 'input', this.onChangeItem.bind(this));

        this.$toggle = this.$container.find('.toggle');
        this.$toggle.click(this.onClickToggle.bind(this));

        $(document.body).click(this.onClickBody.bind(this));
    }

    createMenu () {
        let items = this.params.columns.map(this.createItem, this).join('');
        return $(`<div class="data-grid-column-manager-menu">${items}</div>`);
    }

    createItem (data) {
        let label = this.grid.translate(data.label || data.name);
        let checked = data.hidden ? '' : 'checked';
        return `<label class="item-label" title="${data.name}"><input type="checkbox" ${checked} value="${data.name}">${label}</label>`;
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
        let offset = this.$toggle.offset();
        this.$menu.show().offset({
            left: offset.left + this.$toggle.outerWidth() - this.$menu.outerWidth(),
            top: offset.top + this.$toggle.outerHeight() + 1
        });
    }

    changeItem ($item) {
        let $checkbox = $item.find('input');
        let checked = !$checkbox.is(':checked');
        $checkbox.prop('checked', checked);
    }

    // STORE

    save () {
        store.set(this.getStoreKey(), this.getStoreData());
    }

    load () {
        let items = store.get(this.getStoreKey());
        if (this.checkStoreData(items)) {
            items.forEach((item, index)=> {
                this.params.columns[index].hidden = item.hidden;
            });
        }
    }

    checkStoreData (items) {
        return Array.isArray(items)
            ? Ant.ArrayHelper.equals(items.map(item => item.name), this.params.columns.map(item => item.name))
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