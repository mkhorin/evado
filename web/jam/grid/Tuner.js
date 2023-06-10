/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
Jam.DataGridTuner = class DataGridTuner {

    constructor (grid) {
        this.grid = grid;
        this.params = grid.params;
        this.columns = this.params.columns;
        this.$container = grid.$container.find('.data-grid-tuner');
        if (this.$container.length) {
            this.defaultData = this.getStorageData();
            this.load();
            this.createMenu();
            this.$toggle = this.$container.find('.toggle');
            this.$toggle.click(this.onToggle.bind(this));
            this.attachOnBody();
            this.attachOnResize();
        }
    }

    createMenu () {
        this.$menu = this.renderMenu();
        this.$menu.on('click', '.reset-item', this.onReset.bind(this));
        this.$menu.on('click', '.order-up', this.onOrderUp.bind(this));
        this.$menu.on('click', '.order-down', this.onOrderDown.bind(this));
        this.$menu.on('change', 'input.show', this.onShowItem.bind(this));
        this.$menu.on('change', 'input.group', this.onGroupItem.bind(this));
        this.grid.$container.append(this.$menu);
    }

    renderMenu () {
        this._groupName = this.grid.getGroupName();
        const items = this.columns.map(this.createItem, this).join('');
        const reset = `<div class="reset-item">${Jam.t('Reset to default')}</div>`;
        return $(`<div class="data-grid-tuner-menu">${items}${reset}</div>`);
    }

    createItem ({label, name, hidden, grouping, translate}) {
        const show = this.createInput(name, 'Show', 'show', !hidden);
        const checked = this._groupName === name;
        const group = grouping ? this.createInput(name, 'Group', 'group', checked) : '';
        const up = this.createItemOrder('up', name);
        const down = this.createItemOrder('down', name);
        label = Jam.escape(Jam.t(label || name, translate));
        label = `<label title="${Jam.escape(name)}">${show}${label}</label>`;
        return `<div class="item">${up}${label}${group}${down}</div>`;
    }

    createInput (name, title, css, checked) {
        title = Jam.escape(Jam.t(title));
        checked = checked ? 'checked' : '';
        return `<input class="${css}" title="${title}" type="checkbox" ${checked} value="${name}">`;
    }

    createItemOrder (code, name) {
        const icon = `<i class="fas fa-chevron-${code}"></i>`;
        name = Jam.escape(name);
        return `<div class="order-${code}" data-name="${name}">${icon}</div>`;
    }

    isMenuActive () {
        return this.$menu.is(':visible');
    }

    attachOnBody () {
        $(document.body).one('click', this.onBody.bind(this));
    }

    attachOnResize () {
        $(window).one('resize', this.onResize.bind(this));
    }

    onBody (event) {
        if (this.isMenuActive()) {
            this.onTarget($(event.target));
        }
        this.attachOnBody();
    }

    onResize () {
        this.hideMenu();
        this.attachOnResize();
    }

    onTarget ($target) {
        if (!$target.closest(this.$toggle).length) {
            if (!$target.closest(this.$menu).length) {
                this.hideMenu();
            }
        }
    }

    onToggle () {
       this.isMenuActive() ? this.hideMenu() : this.showMenu();
    }

    onShowItem (event) {
        const input = event.currentTarget;
        const column = this.columns.find(({name}) => name === input.value);
        column.hidden = !input.checked;
        this.grid.drawContent();
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

    onOrderUp (event) {
        this.moveItem(event.currentTarget.dataset.name, -1);
    }

    onOrderDown (event) {
        this.moveItem(event.currentTarget.dataset.name, 1);
    }

    onReset () {
        const key = this.getStorageKey();
        Jam.localStorage.set(key, this.defaultData);
        this.load();
        this.$menu.remove();
        this.createMenu();
        Jam.localStorage.remove(key);
        this.grid.drawContent();
        this.grid.load();
    }

    moveItem (name, direction) {
        const source = this.columns.findIndex((column) => column.name === name);
        const target = source + direction;
        if (target >= 0 && target < this.columns.length) {
            const buffer = this.columns[source];
            this.columns[source] = this.columns[target];
            this.columns[target] = buffer;
            const $items = this.$menu.find('.item');
            const action = direction < 0 ? 'before' : 'after';
            $items.eq(target)[action]($items.get(source));
            this.save();
            this.grid.drawContent();
        }
    }

    hideMenu () {
        this.$menu.hide();
    }

    showMenu () {
        const offset = this.$toggle.offset();
        const toggleWidth = this.$toggle.outerWidth();
        const toggleHeight = this.$toggle.outerHeight();
        const menuWidth = this.$menu.outerWidth();
        const left = offset.left + toggleWidth - menuWidth;
        const top = offset.top + toggleHeight + 1;
        this.$menu.show().offset({left, top});
    }

    save () {
        const key = this.getStorageKey();
        const data = this.getStorageData();
        Jam.localStorage.set(key, data);
        return data;
    }

    load () {
        const key = this.getStorageKey();
        let {items, grouping} = Jam.localStorage.get(key) || {};
        if (!this.checkStorageItems(items)) {
            const data = this.save();
            items = data.items || [];
            grouping = data.grouping;
        }
        const visible = items.find(({hidden}) => !hidden);
        if (!visible && items[0]) {
            items[0].hidden = false;
        }
        const itemIndexes = {};
        items.forEach(({name}, index) => itemIndexes[name] = index);
        this.columns.sort((a, b) => {
            return itemIndexes[a.name] - itemIndexes[b.name];
        });
        items.forEach(({hidden}, index) => {
            this.columns[index].hidden = hidden;
        });
        if (grouping && this.checkStorageGrouping(grouping)) {
            this.grid.grouping = grouping;
        }
    }

    checkStorageItems (items) {
        if (Array.isArray(items)) {
            const names = items.map(item => item.name);
            const columns = this.columns.map(item => item.name);
            return Jam.ArrayHelper.equalsUnordered(names, columns);
        }
        return false;
    }

    checkStorageGrouping (data) {
        for (const {name, grouping} of this.columns) {
            if (Object.hasOwn(data, name) && !grouping) {
                return false;
            }
        }
        return true;
    }

    getStorageKey () {
        return `data-grid-tuner-${this.params.id}`;
    }

    getStorageData () {
        const grouping = this.grid.grouping;
        const items = this.columns.map(({name, hidden}) => ({name, hidden}));
        return {grouping, items};
    }
};