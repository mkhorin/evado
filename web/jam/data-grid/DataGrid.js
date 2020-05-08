/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

Jam.DataGrid = class DataGrid {

    static get (container) {
        return $(container).data('dataGrid');
    }

    static setDefaults (params) {
        $.extend(true, DataGrid.defaults, params);
    }

    constructor (container, params) {
        params = $.extend(true, {}, Jam.DataGrid.defaults, params);
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
        this.pagination = new params.Pagination(this);
        this.commonSearch = new params.CommonSearch(this);
        this.columnGroupMap = Jam.ArrayHelper.index('name', params.columnGroups);
        this.columnMap = Jam.ArrayHelper.index('name', params.columns);
        if (params.Tuner) {
            this.tuner = new params.Tuner(this);
        }
        this.$info = this.$container.find('.data-grid-info');
        this.$container.data('dataGrid', this);
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
        if (!column.hasOwnProperty('translate') && column.format === 'label') {
            column.translate = '';
        }
    }

    translate () {
        return Jam.i18n.translate(...arguments);
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
        return this.columnMap.hasOwnProperty(name) ? this.columnMap[name] : null;
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
        return this.order.hasOwnProperty(name) ? this.order[name] : null;
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

    toggleLoader (state) {
        this.$container.toggleClass('loading', state);
    }

    drawTable () {
        this.renderer.drawTableFrame();
        this.drawPage();
    }

    drawPage () {
        this.pagination.draw();
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

    // STORE

    getStoreKey (key) {
        return this.params.id + key;
    }

    setStoreData (key, data) {
        Jam.store.set(this.getStoreKey(key), data);
    }

    getStoreData (key, defaults) {
        const data = Jam.store.get(this.getStoreKey(key));
        return data === undefined ? defaults : data;
    }

    clearStoreData (key) {
        Jam.store.remove(this.getStoreKey(key));
    }
};

Jam.TreeGrid = class TreeGrid extends Jam.DataGrid {

    constructor (container, params) {
        super(container, $.extend(true, {}, Jam.TreeGrid.defaults, params));
    }

    init () {
        super.init();
        this.renderer.$tbody.on('click', '.node-toggle', this.onToggleNode.bind(this));
    }

    getNode (id) {
        return this.getNodeByRow(this.findRowById(id));
    }

    getNodeByRow ($row) {
        return Jam.TreeGridNode.get({grid: this, $row});
    }

    onToggleNode (event) {
        this.getNodeByRow($(event.currentTarget).closest('tr')).toggle();
    }

    load (params = {}) {
        this.itemNode = params.node;
        super.load(params);
    }

    drawPage () {
        this.itemNode ? this.drawNode(this.itemNode) : super.drawPage();
    }

    drawNode (node) {
        node.getNested().remove();
        this.renderer.drawNode(node.$row, this.items);
        this.events.trigger('afterDrawNode', node);
    }
};

Jam.TreeGridNode = class TreeGridNode {

    static get ({$row}) {
        return $row.data('node') || Reflect.construct(this, arguments);
    }

    constructor (config) {
        Object.assign(this, config);
        this.$row.data('node', this);
    }

    isOpened () {
        return this.$row.hasClass('opened');
    }

    getId () {
        return this.$row.data('id');
    }

    getDepth () {
        return parseInt(this.$row.data('depth'));
    }

    getChildren () {
        return this.getNested().filter(`[data-depth="${this.getDepth() + 1}"]`);
    }

    getNested () {
        const depth = this.getDepth();
        return this.$row.nextUntil(`[data-depth="${depth}"]`).filter((index, element) => {
            return element.dataset.depth > depth;
        });
    }

    toggle (state) {
        this.$row.toggleClass('opened', state);
        this.isOpened() ? this.expand() : this.collapse();
    }

    collapse () {
        const $children = this.getChildren();
        for (const row of $children.filter('.opened')) {
            this.grid.getNodeByRow($(row)).toggle(false);
        }
        if (this.grid.params.clearCollapsedNode) {
            $children.remove();
            this.loaded = false;
        } else {
            this._detachedChildren = $children.detach();
        }
    }

    expand () {
        this.loaded ? this.$row.after(this._detachedChildren) : this.load();
    }

    load () {
        this.loaded = true;
        this.grid.load({node: this});
    }
};