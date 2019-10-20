/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

Jam.DataGridTuner = class {

    constructor (grid) {
        this.grid = grid;
        this.params = grid.params;
        this.columns = this.params.columns;
        this.$container = grid.$container.find('.data-grid-tuner');
        this.load();
        this.createMenu();
        this.$toggle = this.$container.find('.toggle');
        this.$toggle.click(this.onClickToggle.bind(this));
        $(document.body).click(this.onClickBody.bind(this));
    }

    createMenu () {
        this.grouping = this.columns.filter(({grouping})=> grouping).length > 0;
        this.$menu = this.renderMenu();
        const $body = this.$container.closest('.scroll-body');
        this.$menu.appendTo($body.length ? $body : document.body);
        this.$menu.on('change', 'input.show', this.onShowItem.bind(this));
        this.$menu.on('change', 'input.group', this.onGroupItem.bind(this));
    }

    renderMenu () {
        this._groupName = this.grid.getGroupName();
        const grouping = this.grouping ? 'grouping' : '';
        const items = this.columns.map(this.createItem, this).join('');
        return $(`<div class="data-grid-tuner-menu ${grouping}">${items}</div>`);
    }

    createItem ({label, name, hidden, grouping}) {
        const show = this.createInput(name, 'Show', 'show', !hidden);
        const checked = this._groupName === name;
        const group = grouping ? this.createInput(name, 'Group', 'group', checked) : '';
        label = this.grid.translate(label || name);
        return `<label class="item-label" title="${name}">${show}${group}${label}</label>`;
    }

    createInput (name, title, css, checked) {
        title = this.grid.translate(title);
        checked = checked ? 'checked' : '';
        return `<input class="${css}" title="${title}" type="checkbox" ${checked} value="${name}">`;
    }

    isMenuActive () {
        return this.$menu.is(':visible');
    }

    onClickBody (event) {
        if (this.isMenuActive()) {
            const $target = $(event.target);
            if (!$target.closest(this.$toggle).length && !$target.closest(this.$menu).length) {
                this.hideMenu();
            }
        }
    }

    onClickToggle () {
       this.isMenuActive() ? this.hideMenu() : this.showMenu();
    }

    onShowItem (event) {
        const input = event.currentTarget;
        this.grid.getColumn(input.value).hidden = !input.checked;
        this.grid.drawTable();
        this.save();
        $(input).blur();
    }

    onGroupItem (event) {
        const input = event.currentTarget;
        this.$menu.find('.group').not(input).prop('checked', false);
        input.checked
            ? this.grid.setGrouping(input.value, 1)
            : this.grid.setGrouping(null);
        $(input).blur();
        this.save();
        this.grid.load();
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

    // STORE

    save () {
        store.set(this.getStoreKey(), this.getStoreData());
    }

    load () {
        const {items, grouping} = store.get(this.getStoreKey()) || {};
        if (this.checkStoreData(items)) {
            items.forEach((item, index)=> this.columns[index].hidden = item.hidden);
            this.grid.grouping = grouping;
        }
    }

    checkStoreData (items) {
        if (Array.isArray(items)) {
            items = items.map(item => item.name);
            const columns = this.columns.map(item => item.name);
            return Jam.ArrayHelper.equals(items, columns);
        }
    }

    getStoreKey () {
        return `data-grid-tuner-${this.params.id}`;
    }

    getStoreData () {
        return {
            items: this.columns.map(({name, hidden})=>({name, hidden})),
            grouping: this.grid.grouping
        };
    }
};