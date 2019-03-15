'use strict';

Ant.DataGrid = class {

    static get (container) {
        return $(container).data('dataGrid');
    }

    static setDefaults (params) {
        $.extend(true, DataGrid.defaults, params);
    }

    constructor (container, params) {
        params = $.extend(true, {}, Ant.DataGrid.defaults, params);
        Object.assign(this, params.overridenMethods);
        this.params = params;
        this.order = {...params.order};
        this.event = new Ant.Event(this.constructor.name);
        this.locale = params.locale;
        this.$container = $(container);
        this.provider = params.ajax
            ? new params.AjaxProvider(this)
            : new params.Provider(this);
        this.renderer = new params.Renderer(this);
        this.pagination = new params.Pagination(this);
        this.commonSearch = new params.CommonSearch(this);
        this.columnGroupMap = Ant.ArrayHelper.index('name', params.columnGroups);
        this.columnMap = Ant.ArrayHelper.index('name', params.columns);
        if (params.ColumnManager) {
            this.columnManager = new params.ColumnManager(this);
        }
        this.$info = this.$container.find('.data-grid-info');
        this.$container.data('dataGrid', this);
    }

    init () {
        this.renderer.drawTableFrame();
        this.renderer.$thead.on('click', '.order-toggle', this.onToggleOrder.bind(this));
        setTimeout(this.load.bind(this), 0);
    }

    translate () {
        return Ant.I18n.translate.apply(Ant.I18n, arguments);
    }

    setParams (params) {
        $.extend(true, this.params, params);
    }

    findRows (selector) {
        return this.renderer.findRows(selector);
    }

    findRowById (id) {
        return this.renderer.findRowById(id);
    }

    getRowData ($rows, column) {
        return $rows.map((index, row)=> this.getData(row.dataset.id, column)).get();
    }

    getData (id, column) {
        if (id === undefined) {
            return this.dataMap;
        }
        if (Object.keys(this.dataMap).includes(id)) {
            return column === undefined ? this.dataMap[id] : this.dataMap[id][column];
        }
    }

    isSortableColumn (name) {
        return this.getColumn(name).sortable;
    }

    getColumn (name) {
        return this.columnMap.hasOwnProperty(name) ? this.columnMap[name] : null;
    }

    getVisibleColumns () {
        return this.params.columns.filter(column => !column.hidden);
    }

    getOrderDirection (name) {
        return this.order && this.order.hasOwnProperty(name) && this.order[name];
    }

    setPage (page) {
        this.pagination.setPage(page);
    }

    setOrder (name, direction) {
        this.order = direction ? {[name]: direction} : this.order;
    }

    addOrder (name, direction) {
        this.order = direction ? {...this.order, [name]: direction} : this.order;
    }

    clearOrder () {
        this.order = {};
        this.renderer.clearOrder();
    }

    load (resetPage) {
        if (resetPage) {
            this.setPage(0);
        }
        this.togglePageLoader(true);
        this.event.trigger('beforeLoad', this);
        this.provider.load();
    }

    afterLoad (data, totalSize, maxSize) {
        this.data = data || [];
        this.dataMap = Ant.ArrayHelper.index(this.params.key, data);
        this.dataTotalSize = totalSize;
        this.dataMaxSize = maxSize;
        this.event.trigger('afterLoad', this);
        this.togglePageLoader(false);
        this.drawPage();
        this.dataMap = Ant.ArrayHelper.index(this.params.key, data);
    }

    fail (data) {
        this.togglePageLoader(false);
        this.lastError = data;
        this.event.trigger('afterFail', this);
    }

    togglePageLoader (state) {
        this.$container.toggleClass('loading', state);
    }

    drawTable () {
        this.renderer.drawTableFrame();
        this.drawPage();
    }

    drawPage () {
        this.pagination.draw();
        this.$info.html(this.getInfo());
        this.renderer.drawBody(this.data);
        this.event.trigger('afterDrawPage', this);
    }

    getInfo () {
        let info = this.locale.info;
        if (this.data.length) {
            let interval = this.pagination.getDataInterval(this.dataTotalSize);
            info = info.replace('#{START}', interval[0] + 1);
            info = info.replace('#{END}', interval[1]);
            info = info.replace('#{TOTAL}', this.dataTotalSize);
        } else {
            info = this.locale.infoEmpty;
        }
        return this.dataTotalSize !== this.dataMaxSize
            ? `${info} ${this.locale.infoFiltered.replace('#{MAX}', this.dataMaxSize)}`
            : info;
    }

    onToggleOrder (event) {
        let $toggle = $(event.currentTarget);
        let $cell = $toggle.closest('th');
        let name = $cell.data('name');
        let direction = $cell.hasClass('asc') ? -1 : 1;
        if (event.shiftKey) {
            direction = 0;
            delete this.order[name];
        } else if (event.ctrlKey) {
            this.addOrder(name, direction);
        } else {
            this.renderer.clearOrder();
            this.setOrder(name, direction);
        }
        this.renderer.toggleOrder($toggle, direction);
        this.load();
    }

    // STORE

    getStoreKey (key) {
        return this.params.id + key;
    }

    setStoreData (key, data) {
        store.set(this.getStoreKey(key), data);
    }

    getStoreData (key, defaults) {
        let data = store.get(this.getStoreKey(key));
        return data === undefined ? defaults : data;
    }

    removeStoreData (key) {
        store.remove(this.getStoreKey(key));
    }
};