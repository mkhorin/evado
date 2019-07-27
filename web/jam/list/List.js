/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

Jam.List = class extends Jam.Element {

    constructor ($grid, data) {
        super($grid);

        Object.assign(this, data);
        this.$grid = $grid;
        this.$container = $grid.closest('.box');
        this.$header = this.$container.children('.box-header');
        this.$content = this.$container.children('.box-body');
        this.$controls = this.$header.children('.list-controls');
        this.$modal = this.$container.closest('.jmodal');
        this.modal = this.$modal.data('modal');
        this.childModal = Jam.modal.create();
        this.$controls.prepend(this.$modal.find('.before-list-controls'));
        this.$controls.append(this.$modal.find('.after-list-controls'));
        this.events = new Jam.Events('List');
        this.notice = this.createNotice();
        this.params = {
            multiple: true,
            ...this.$grid.data('params')
        };
        this.init();
    }

    init () {
        this.$controls.on('click', '[data-id]', this.onControl.bind(this));
        this.getControl('selectAll').toggle(this.params.multiple);
        this.$controls.find('.list-tool').each((index, element)=> Jam.ListTool.create($(element), this));
        this.setDataGridParams();
        this.createDataGrid();
        this.initDataGrid();
        this.createFilter();
        this.grid.init();
        this.$tbody = this.grid.renderer.$tbody;
        this.$tbody.on('click', 'tr', this.onClickRow.bind(this));
        this.$tbody.on('dblclick', 'tr', this.onDoubleClickRow.bind(this));
    }

    createDataGrid () {
        this.grid = new Jam.DataGrid(this.$grid, this.params);
    }

    initDataGrid () {
        this.grid.events.on('beforeLoad', this.beforeLoad.bind(this));
        this.grid.events.on('beforeXhr', this.beforeXhr.bind(this));
        this.grid.events.on('afterLoad', this.afterLoad.bind(this));
        this.grid.events.on('afterFail', this.afterLoad.bind(this));
        this.grid.events.on('afterDrawPage', this.afterDrawPage.bind(this));
    }

    createFilter () {
        this.filter = new Jam.ListFilter(this, this.params.filter);
        this.grid.events.on('toggleAdvancedSearch', this.filter.toggle.bind(this.filter, null));
        if (this.filter.isExists()) {
            this.$grid.addClass('has-advanced-search');
            this.filter.events.on('afterBuild', this.onBuildFilter.bind(this));
        }
    }

    onBuildFilter () {
        this.filter.events.on('toggleActive', (event, data)=>{
            this.$grid.toggleClass('active-advanced-search', data);
        });
        this.$thead = this.grid.renderer.$thead;
        for (let cell of this.$thead.find('th')) {
            if (this.filter.getAttrParams(cell.dataset.name)) {
                $(cell).addClass('searchable');
            }
        }
        this.$thead.on('click', '.searchable .search-toggle', event => {
            this.filter.toggle(true);
            this.filter.getEmptyCondition().setAttr($(event.currentTarget).closest('th').data('name'));
        });
    }

    onControl (event) {
        this.beforeControl(event);
        switch (event.currentTarget.dataset.id) {
            case 'view': return this.view();
            case 'create': return this.create();
            case 'clone': return this.clone();
            case 'update': return this.update();
            case 'remove': return this.remove();
            case 'reload': return this.reload();
            case 'index': return this.index();
            case 'sort': return this.sort();
            case 'executeByUrl': return this.executeByUrl(event);
            case 'selectAll': return this.selectAll();
        }
        return false;
    }

    setDataGridParams () {
        this.params.columns.forEach(this.prepareColumnData.bind(this));
        if (this.params.list) {
            this.params.ajax = {url: this.params.list};
        }
        // rowCallback: this.prepareRow.bind(this),
        this.params.overridenMethods = {
            isSearchableColumn: this.isSearchableColumn.bind(this)
        }
    }

    isSearchableColumn (name) {
        return !!this.filter.getAttrParams(name);
    }

    prepareColumnData (data) {
        data.render = Jam.ColumnRenderer.getRenderMethod(data.format);
        data.format = Jam.ColumnRenderer.prepareFormat(data.format);
    }

    createNotice () {
        return new Jam.Notice({
            container: $notice => this.$content.prepend($notice),
            $scrollTo: this.$content
        });
    }

    toggleLoader (state) {
        this.$container.toggleClass('loading', state);
    }

    beforeLoad (event) {
        this.toggleLoader(true);
    }

    beforeXhr (event, data) {
        data.request.data.filter = this.filter.serialize();
    }

    afterLoad (event) {
        this.toggleLoader(false);
    }

    afterDrawPage () {
        this.prepareRows();
    }

    getListId () {
        return this.params.list;
    }

    prepareRows () {
        this.findRows().each((index, row)=> {
            this.prepareRow(row, this.grid.getData(row.dataset.id), index);
        });
    }

    prepareRow () {
        if (this[this.params.prepareRow] instanceof Function) {
            this[this.params.prepareRow](...arguments);
        }
    }

    // SELECTION

    onClickRow (event) {
        if ($(event.target).closest('a').length) {
            return true;
        }  
        if (!this.params.multiple || !event.ctrlKey) {
            this.deselectExceptOneRow(event.currentTarget);
        }
        this.toggleRowSelect($(event.currentTarget), event.ctrlKey ? undefined : true);
    }

    onDoubleClickRow (event) {
        if ($(event.target).closest('a').length) {
            return true;
        }
        this.deselectExceptOneRow(event.currentTarget);
        this.toggleRowSelect($(event.currentTarget), true);
        event.ctrlKey
            ? this.openNewPage()
            : this.getControl('update').click();
    }

    openNewPage () {
        let $row = this.getSelectedRow();
        if ($row) {
            let data = Jam.UrlHelper.addUrlParams(this.params.update, this.getObjectIdParam($row));
            Jam.UrlHelper.openNewPage(Jam.UrlHelper.getNewPageUrl(data));
        }
    }

    deselectExceptOneRow ($row) {
        this.toggleRowSelect(this.findSelectedRows().not($row), false);
    }

    toggleRowSelect ($row, state) {
        $row.toggleClass('selected', state);
    }

    getObjectIdParam ($rows) {
        return {id: this.getObjectIds($rows)[0]};
    }

    getObjectIds ($rows) {
        return $rows.get().map(row => row.dataset.id);
    }

    getObjectValues (name, $rows) {
        return this.grid.getRowData($rows, name);
    }

    serializeObjectIds ($rows) {
        return $rows ? this.getObjectIds($rows).join() : '';
    }

    getSelectedRow (message = 'Select one item to action') {
        let $row = this.findSelectedRows();
        return $row.length === 1 ? $row : this.notice.warning(message);
    }

    getSelectedRows (message = 'Select items to action') {
        let $rows = this.findSelectedRows();
        return $rows.length ? $rows : this.notice.warning(message);
    }

    findSelectedRows () {
        return this.findRows('.selected');
    }

    findRows (selector) {
        return this.grid.findRows(selector);
    }

    removeObjects ($rows) {
        let ids = this.serializeObjectIds($rows);
        this.post(this.params.remove, {ids}).done(()=> {
            ids = ids.split(',');
            this.events.trigger('afterRemove', {ids});
            this.reload();
        });
    }

    loadModal (url, params, afterClose, modalParams) {
        afterClose = afterClose || this.defaultModalAfterClose;
        this.childModal.load(url, params, modalParams).done(()=>{
            this.childModal.one('afterClose', afterClose.bind(this));
        });
    }

    defaultModalAfterClose (event, data) {
        if (data && data.saved) {
            this.currentRowId = data.result;
            this.reload();
            if (data.reopen) {
                this.loadModal(this.params.update, {id: data.result});
            }
        }
    }

    post (url, data) {
        this.toggleLoader(true);
        return this.xhr = $.post(url, data).always(()=> {
            this.toggleLoader(false);
        }).fail(xhr => {
            this.notice.danger(xhr.responseText || xhr.statusText);
        });
    }

    // CONTROLS

    getControl (id) {
        return this.$controls.find(`[data-id="${id}"]`);
    }

    beforeControl () {
        this.notice.hide();
    }

    reload (resetPage) {
        this.grid.load(resetPage);
    }

    index () {
        this.childModal.load(this.params.index);
    }
    
    view () {
        let $row = this.getSelectedRow();
        $row && this.childModal.load(this.params.view, this.getObjectIdParam($row));
    }

    create (params) {
        this.loadModal(this.params.create, params);
    }

    clone () {
        let $row = this.getSelectedRow();
        $row && this.loadModal(this.params.clone, this.getObjectIdParam($row));
    }

    update () {
        let $row = this.getSelectedRow();
        $row && this.loadModal(this.params.update, this.getObjectIdParam($row));
    }

    remove () {
        let $rows = this.getSelectedRows();
        if ($rows) {
            Jam.confirmation.showRemove().then(this.removeObjects.bind(this, $rows));
        }
    }

    sort () {
        this.modalSort = this.modalSort || new Jam.ListSort(this, this.params.modalSort);
        this.modalSort.execute();
    }

    executeByUrl (event) {
        let $btn = $(event.currentTarget);
        if (!$btn.data('select')) {
            return this.loadModal($btn.data('url'));
        }
        let $row = this.getSelectedRow();
        $row && this.loadModal($btn.data('url'), this.getObjectIdParam($row));
    }

    selectAll () {
        this.toggleRowSelect(this.$tbody.children(), true);
    }
};

Jam.MainList = class extends Jam.List {

    init () {
        super.init();
        this.utilManager = new Jam.UtilManager(this.$controls, this);
    }
};

Jam.SelectList = class extends Jam.List {

    init () {
        Object.assign(this.params, this.modal.initData);
        super.init();
        this.$selectBtn = this.getControl('select');
        this.$selectBtn.show();
        this.$selectBtn.click(this.onSelect.bind(this));
    }

    onDoubleClickRow (event) {
        this.deselectExceptOneRow(event.currentTarget);
        this.toggleRowSelect($(event.currentTarget), true);
        event.ctrlKey
            ? this.openNewPage()
            : this.onSelect();
    }

    onSelect () {
        this.params.select
            ? this.selectByUrl(this.params.select)
            : this.selectByRows();
    }

    selectByRows () {
        let $rows = this.params.multiple
            ? this.getSelectedRows()
            : this.getSelectedRow();
        if ($rows) {
            this.modal.close({result: this.serializeObjectIds($rows)});
        }
    }

    selectByUrl (url) {
        let $rows = this.params.multiple
            ? this.getSelectedRows()
            : this.getSelectedRow();
        if (!$rows) {
            return false;
        }
        this.post(url, {ids: this.serializeObjectIds($rows)}).done(id => {
            this.modal.close({
                result: id,
                saved: true
            });
        });
    }
};

Jam.TreeList = class extends Jam.List {

    createDataGrid () {
        this.grid = new Jam.TreeDataGrid(this.$grid, this.params);
    }
};

Jam.MainTreeList = class extends Jam.TreeList {

    init () {
        super.init();
        this.utilManager = new Jam.UtilManager(this.$controls, this);
    }

    create (params) {
        let $row = this.getSelectedRow();
        if (!$row) {
            return super.create();
        }
        let node = this.grid.getNodeByRow($row);
        super.create({
            node: node.getId(),
            depth: node.getDepth()
        });
    }
};