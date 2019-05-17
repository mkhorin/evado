'use strict';

Ant.List = class {

    static init (modal, selector = '.ant-list') {
        let $content = modal ? modal.$modal : $(document.body);
        return $content.find(selector).each((index, element)=> this.create($(element)));
    }

    static create ($grid) {
        return this.get($grid) || Reflect.construct(this, arguments);
    }

    static get ($grid) {
        return $grid.data('ant-list');
    }

    constructor ($grid, data) {
        Object.assign(this, data);
        this.$grid = $grid;
        this.$grid.data('ant-list', this);
        this.$container = $grid.closest('.box');
        this.$header = this.$container.children('.box-header');
        this.$content = this.$container.children('.box-body');
        this.$controls = this.$header.children('.list-controls');
        this.$modal = this.$container.closest('.ant-modal');
        this.modal = this.$modal.data('modal');
        this.childModal = Ant.modal.create();
        this.$controls.prepend(this.$modal.find('.before-list-controls'));
        this.$controls.append(this.$modal.find('.after-list-controls'));
        this.notice = this.createNotice();
        this.params = {
            multiple: true,
            ...this.$grid.data('params')
        };
        this.init();
    }

    init () {
        this.$controls.on('click', '[data-id]', this.onClickControl.bind(this));
        this.getControl('selectAll').toggle(this.params.multiple);
        this.$controls.find('.list-tool').each((index, element)=> Ant.ListTool.create($(element), this));

        this.createDataGrid();
        this.createFilter();

        this.grid.init();
        this.$tbody = this.grid.renderer.$tbody;
        this.$tbody.on('click', 'tr', this.onClickRow.bind(this));
        this.$tbody.on('dblclick', 'tr', this.onDoubleClickRow.bind(this));
    }

    createDataGrid () {
        this.setDataGridParams();
        this.grid = new Ant.DataGrid(this.$grid, this.params);
        this.grid.event.on('beforeLoad', this.beforeLoad.bind(this));
        this.grid.event.on('beforeXhr', this.beforeXhr.bind(this));
        this.grid.event.on('afterLoad', this.afterLoad.bind(this));
        this.grid.event.on('afterFail', this.afterLoad.bind(this));
        this.grid.event.on('afterDrawPage', this.afterDrawPage.bind(this));
    }

    createFilter () {
        this.filter = new Ant.ListFilter(this, this.params.filter);
        this.grid.event.on('toggleAdvancedSearch', this.filter.toggle.bind(this.filter, null));
        if (this.filter.isExists()) {
            this.$grid.addClass('has-advanced-search');
            this.filter.event.on('afterBuild', this.onBuildFilter.bind(this));
        }
    }

    onBuildFilter () {
        this.filter.event.on('toggleActive', (event, data)=>{
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

    onClickControl (event) {
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
            this.params.ajax = {
                url: this.params.list
            };
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
        data.render = Ant.ColumnRenderHelper.get(data.format);
        data.format = Ant.ColumnRenderHelper.prepareFormat(data.format);
    }

    createNotice () {
        return new Ant.Notice({
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
        data.params.filter = this.filter.serialize();
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

    prepareRow (...args) {
        if (this[this.params.prepareRow] instanceof Function) {
            this[this.params.prepareRow](...args);
        }
    }

    // SELECTION

    onClickRow (event) {
        this.notice.hide();
        if (!this.params.multiple || !event.ctrlKey) {
            this.deselectExceptOneRow(event.currentTarget);
        }
        this.toggleRowSelect($(event.currentTarget), event.ctrlKey ? undefined : true);
    }

    onDoubleClickRow (event) {
        this.deselectExceptOneRow(event.currentTarget);
        this.toggleRowSelect($(event.currentTarget), true);
        event.ctrlKey
            ? this.openNewPage()
            : this.getControl('update').click();
    }

    openNewPage () {
        let $row = this.getSelectedRow();
        if ($row) {
            let data = Ant.UrlHelper.addUrlParams(this.params.update, this.getObjectIdParam($row));
            Ant.UrlHelper.openNewPage(Ant.UrlHelper.getNewPageUrl(data));
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
        return this.getObjectValues(this.params.key, $rows);
    }

    getObjectValues (name, $rows) {
        return this.grid.getRowData($rows, name);
    }

    serializeObjectIds ($rows) {
        return $rows ? this.getObjectIds($rows).join() : '';
    }

    getSelectedRow () {
        let $row = this.findSelectedRows();
        return $row.length === 1 ? $row : this.notice.warning('Select one item to action');
    }

    getSelectedRows () {
        let $rows = this.findSelectedRows();
        return $rows.length ? $rows : this.notice.warning('Select items to action');
    }

    findSelectedRows () {
        return this.findRows('.selected');
    }

    findRows (selector) {
        return this.grid.findRows(selector);
    }

    removeObjects ($rows) {
        this.post(this.params.remove, {
            ids: this.serializeObjectIds($rows)
        }).done(this.reload.bind(this));
    }

    loadModal (url, params, afterClose, modalParams) {
        afterClose = afterClose || this.defaultModalAfterClose;
        this.childModal.load(url, params, ()=> {
            this.childModal.one('afterClose', afterClose.bind(this));
        }, modalParams);
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
        if ($rows && Ant.Helper.confirm('Delete this object?')) {
            this.removeObjects($rows);
        }
    }

    sort () {
        this.modalSort = this.modalSort || new Ant.ListSort(this, this.params.modalSort);
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

Ant.MainList = class extends Ant.List {

    init () {
        super.init();
        this.utilManager = new Ant.UtilManager(this.$controls, this);
    }
};

Ant.SelectList = class extends Ant.List {

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