'use strict';

Ant.ListColumnSelector = class {

    constructor (list) {
        this.list = list;
        this.$selector = list.$content.find('.column-selector');
        if (this.$selector.length) {
            this.init();
        }
    }

    init () {
        this.$menu = this.$selector.find('.dropdown-menu');
        this.$menu.on('click', '.item a', this.select.bind(this));
        this.$menu.on('click', '.reset a', this.reset.bind(this));
        this.onDragStart = this.dragStart.bind(this);
        this.onDragEnd = this.dragEnd.bind(this);
        this.onDragEnter = this.dragEnter.bind(this);
        this.onDragOver = this.dragOver.bind(this);
        this.onDragLeave = this.dragLeave.bind(this);
        this.onDrop = this.drop.bind(this);

        this.$toggle = this.$selector.find('> .btn');
        this.$toggle.click(this.show.bind(this));

        this.list.$table.on('destroy.dt', this.onListDestroy.bind(this));
        this.list.$table.on('init.dt', this.onListInit.bind(this));
        $(document.body).on('mousedown', this.onMouseDown.bind(this));
        this.createMenu();
    }

    createMenu () {
        this.$menu.empty();
        this.attrs = store.get(this.getStoreId());
        if (!(this.attrs instanceof Array)) {
            this.attrs = [];
        }
        this.sortDataTableColumns();
        let columns = this.list.dtOptions.columns;
        for (let i = 0; i < columns.length; ++i) {
            this.createMenuItem(columns[i], this.attrs[i]);
        }
        this.$menu.append('<li class="divider"></li>');
        this.$menu.append('<li class="reset"><a href="javascript:void(0)">Reset to default</a></li>');
    }

    createMenuItem (item, attr) {
        let $item = $(`<li class="item" draggable="true"><a href="javascript:void(0)">${item.title}</a></li>`);
        let name = item.name;
        if (!attr || name !== attr.name) {
            attr = null;
        }
        $item.data('attr', name);
        let active = attr ? attr.visible : (item.visible === undefined || item.visible);
        $item.toggleClass('active', active);
        item.visible = active;
        this.$menu.append($item);
        item = $item.get(0);
        item.ondragstart = this.onDragStart;
        item.ondragend = this.onDragEnd;
        item.ondragenter = this.onDragEnter;
        item.ondragover = this.onDragOver;
        item.ondragleave = this.onDragLeave;
        item.ondrop = this.onDrop;
    }

    getItems () {
        return this.$menu.find('.item');
    }

    show () {
        $(document.body).append(this.$menu);
        this.$menu.show();
        let pos = this.$toggle.offset();
        this.$menu.offset({
            left: pos.left + this.$toggle.outerWidth() - this.$menu.outerWidth(),
            top: pos.top + this.$toggle.outerHeight()
        });
    }

    reset (event) {
        store.remove(this.getStoreId());
        this.list.setDataTableOptions();
        this.list.createDataTable();
        this.createMenu();
        this.$menu.hide();
    }

    select (event) {
        let $item = $(event.currentTarget).parent().toggleClass('active');
        let column = this.list.dt.column($item.data('attr') + ':name');
        column.visible($item.hasClass('active'));
        this.save();
    }

    getStoreId () {
        return `dt.columnSelector.${this.list.getListId()}`;
    }

    save () {
        let data  = [];
        this.getItems().each(function () {
            let $item = $(this);
            data.push({
                name: $item.data('attr'),
                visible: $item.hasClass('active')
            });
        });
        this.attrs  = data;
        store.set(this.getStoreId(), data);
    }

    onListInit (event, settings) {
        let $container = this.list.$content.find('.dt-column-selector');
        $container.append(this.$selector);
        $container.parent().append(this.$menu);
        if (this.$menu.is(':visible')) {
            this.show();
        }
    }

    onListDestroy (event, settings) {
        this.$selector.append(this.$menu);
        this.list.$content.append(this.$selector);
    }

    onMouseDown (event) {
        if (this.$menu.is(':visible') && $(event.target).closest('.dropdown-menu').get(0) !== this.$menu.get(0)) {
            this.$menu.hide();
        }
    }

    // DRAG

    dragStart (event) {
        event.dataTransfer.setData('text/plain', $(event.currentTarget).data('attr'));
    }

    dragEnd (event) {
    }

    dragEnter (event) {
        $(event.currentTarget).addClass('targeted');
    }

    dragOver (event) {
        event.preventDefault();
    }

    dragLeave (event) {
        $(event.currentTarget).removeClass('targeted');
    }

    drop (event) {
        let attr = event.dataTransfer.getData('text');
        let $items = this.getItems();
        let $target = $items.filter((index, elem)=> $(elem).data('attr') === attr);
        $(event.currentTarget).before($target);
        $items.removeClass('targeted');
        event.dataTransfer.clearData();
        event.preventDefault();
        this.save();
        this.sortDataTableColumns();
        this.list.createDataTable();
    }

    sortDataTableColumns () {
        let columns = this.list.dtOptions.columns;
        if (this.attrs.length) {
            for (let col of columns) {
                col.pos = this.getIndexByName(col.name);
            }
            columns.sort((a, b)=> a.pos - b.pos);
        }
    }

    getIndexByName (name) {
        for (let i = 0; i < this.attrs.length; ++i) {
            if (this.attrs[i] && this.attrs[i].name === name) {
                return i;
            }
        }
        return -1;
    }
};