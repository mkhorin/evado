/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
Jam.DataGrid = class DataGrid {

    static get (container) {
        return $(container).data('dataGrid');
    }

    static setDefaults (params) {
        $.extend(true, DataGrid.defaults, params);
    }

    constructor (container, params) {
        params = $.extend(true, {
            'AjaxProvider': Jam.DataGridAjaxProvider,
            'CommonSearch': Jam.DataGridCommonSearch,
            'Pagination': Jam.Pagination,
            'Provider': Jam.DataGridProvider,
            'Renderer': Jam.DataGridRenderer,
            'Tuner': Jam.DataGridTuner
        }, Jam.DataGrid.defaults, params);
        Object.assign(this, params.overridenMethods);
        this.params = params;
        this.order = {...params.order};
        this.grouping = {...params.grouping};
        this.events = new Jam.Events('DataGrid');
        this.locale = params.locale;
        this.$container = $(container);
        this.provider = params.ajax
            ? new params.AjaxProvider(this)
            : new params.Provider(this);
        this.renderer = new params.Renderer(this);
        this.pagination = this.createPagination();
        this.commonSearch = new params.CommonSearch(this);
        this.columnGroupMap = Jam.ArrayHelper.index('name', params.columnGroups);
        this.columnMap = Jam.ArrayHelper.index('name', params.columns);
        this.tuner = params.Tuner ? new params.Tuner(this) : null;
        this.$info = this.$container.find('.data-grid-info');
        this.$container.data('dataGrid', this);
    }

    createPagination () {
        return new this.params.Pagination(this, {
            labels: this.locale.pagination,
            params: this.params,
            $pager: this.$container.find('.data-grid-pager'),
            $pagination: this.$container.find('.data-grid-pagination'),
            $jumper: this.$container.find('.data-grid-page-jumper'),
            $pageSize: this.$container.find('.data-grid-page-size')
        });
    }

    init () {
        this.prepareColumns();
        this.renderer.drawTableFrame();
        this.renderer.$thead.on('click', '.order-toggle', this.onToggleOrder.bind(this));
        this.renderer.$tbody.on('click', '.order-toggle', this.onToggleGroupOrder.bind(this));
        setTimeout(this.load.bind(this), 0);
    }

    prepareColumns () {
        const oneColumn = this.params.columns.length === 1;
        for (const column of this.params.columns) {
            column.hidden = oneColumn ? false : column.hidden;
            this.resolveColumnTranslation(column);
        }
    }

    resolveColumnTranslation (column) {
        if (!column.hasOwnProperty('translateData') && column.format === 'label') {
            column.translateData = '';
        }
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
        return $rows.map((index, row) => this.getData(row.dataset.id, column)).get();
    }

    getData (id, column) {
        if (id === undefined) {
            return this.itemMap;
        }
        if (Object.keys(this.itemMap).includes(id)) {
            return column === undefined ? this.itemMap[id] : this.itemMap[id][column];
        }
    }

    isSortableColumn (name) {
        return this.getColumn(name).sortable;
    }

    getColumn (name) {
        return Jam.ObjectHelper.has(name, this.columnMap) ? this.columnMap[name] : null;
    }

    getVisibleColumns () {
        return this.params.columns.filter(column => !column.hidden);
    }

    getGroupName () {
        return this.grouping ? Object.keys(this.grouping)[0] : null;
    }

    getGroupDirection () {
        return this.grouping ? Object.values(this.grouping)[0] : null;
    }

    setGrouping (name, direction) {
        this.grouping = name ? {[name]: direction} : null;
    }

    getOrderDirection (name) {
        return Jam.ObjectHelper.has(name, this.order) ? this.order[name] : null;
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

    getTotalSize () {
        return this.itemTotalSize;
    }

    setPage (page) {
        this.pagination.setPage(page);
    }
    
    load (params = {}) {
        if (params.resetPage) {
            this.setPage(0);
        }
        this.toggleLoader(true);
        this.events.trigger('beforeLoad', this);
        this.provider.load(params);
    }

    afterLoad ({items, totalSize, maxSize}) {
        this.items = items || [];
        this.itemMap = Jam.ArrayHelper.index(this.params.key, items);
        this.itemTotalSize = totalSize;
        this.itemMaxSize = maxSize;
        this.events.trigger('afterLoad', this);
        this.toggleLoader(false);
        this.drawPage();
    }

    fail (data) {
        this.toggleLoader(false);
        this.lastError = data;
        this.events.trigger('afterFail', this);
    }

    toggleClass () {
        this.$container.toggleClass(...arguments);
    }

    toggleLoader () {
        this.toggleClass('loading', ...arguments);
    }

    drawTable () {
        this.renderer.drawTableFrame();
        this.drawPage();
    }

    drawPage () {
        this.pagination.update();
        this.$info.html(this.getInfo());
        this.renderer.drawBody(this.items);
        this.events.trigger('afterDrawPage', this);
    }

    getInfo () {
        let info = this.locale.info;
        if (this.items.length) {
            const interval = this.pagination.getDataInterval(this.itemTotalSize);
            info = info.replace('#{START}', interval[0] + 1);
            info = info.replace('#{END}', interval[1]);
            info = info.replace('#{TOTAL}', this.itemTotalSize);
        } else {
            info = this.locale.infoEmpty;
        }
        if (this.itemTotalSize !== this.itemMaxSize) {
            info = `${info} ${this.locale.infoFiltered.replace('#{MAX}', this.itemMaxSize)}`;
        }
        return info;
    }

    onToggleOrder (event) {
        const $toggle = $(event.currentTarget);
        const $cell = $toggle.closest('th');
        const name = $cell.data('name');
        let direction = -this.renderer.getDirection($cell);
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

    onToggleGroupOrder (event) {
        const $row = $(event.currentTarget).closest('tr');
        this.setGrouping(this.getGroupName(), -this.renderer.getDirection($row));
        this.load();
    }

    getStorageKey (key) {
        return this.params.id + key;
    }

    getStorageData (key, defaults) {
        return Jam.localStorage.get(this.getStorageKey(key), defaults);
    }

    setStorageData (key, data) {
        Jam.localStorage.set(this.getStorageKey(key), data);
    }
};

Jam.DataGrid.defaults = {
    columns: [
        // {name: 'b', label: 'B', group: 'g1', sortable: true, searchable: true, hidden: false}
    ],
    columnGroups: [
        // {name: 'g1', label: 'G1', parent: null, hidden: false}
    ],
    rowGroups: {
        // column:
    },
    data: [
        /* {'a': 'a1', 'b': 'b1', 'c': 'c1'},
        {'a': 'a2', 'b': 'b2', 'c': 'c2'},
        {'a': 'a3', 'b': 'b3', 'c': 'c3'},
        {'a': 'a4', 'b': 'b4', 'c': 'c4'},
        {'a': 'a1', 'b': 'b1', 'c': 'c5'},
        {'a': 'a1', 'b': 'b1', 'c': 'c9'},
        {'a': 'a2', 'b': 'b2', 'c': 'c10'},
        {'a': 'a3', 'b': 'b3', 'c': 'c11'},
        {'a': 'a4', 'b': 'b4', 'c': 'c12'}, */
    ],
    hideOnePageToggle: true,
    hideColumnGroups: false,
    page: 0,
    pageSize: 10,
    pageSizes: [10, 20, 30],
    keepPageSize: true,
    maxPageToggles: 9,
    order: null,
    maxCellHeight: 0,
    locale: {
        orderToggle: 'Sort',
        searchToggle: 'Search',
        asc: 'Ascending',
        desc: 'Descending',
        info: 'Showing #{START} to #{END} of #{TOTAL}',
        infoEmpty: 'Showing 0 to 0 of 0',
        infoFiltered: '(filtered from #{MAX})'
    }
};