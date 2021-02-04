/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
Jam.List = class List extends Jam.Element {

    constructor ($grid, data) {
        super($grid);
        Object.assign(this, data);
        this.$grid = $grid;
        this.$commands = this.$grid.children('.commands');
        this.$frame = this.$grid.closest('.stack-frame');
        this.frame = this.$frame.data('frame');
        this.childFrame = Jam.frameStack.createFrame();
        this.$commands.prepend(this.$frame.find('.prepend-commands').children());
        this.$commands.append(this.$frame.find('.append-commands').children());
        Jam.Helper.sortChildrenByInteger(this.$commands);
        this.events = new Jam.Events('List');
        this.alert = this.createAlert();
        this.params = {
            multiple: true,
            ...this.$grid.data('params')
        };
    }

    init () {
        this.$commands.on('click', '[data-command]', this.onCommand.bind(this));
        this.createColumnRenderer();
        this.setDataGridParams();
        this.createDataGrid();
        this.initDataGrid();
        this.createFilter();
        this.grid.init();
        this.$tbody = this.grid.renderer.$tbody;
        this.$tbody.on('click', 'tr.item', this.onClickRow.bind(this));
        this.$tbody.on('dblclick', 'tr.item', this.onDoubleClickRow.bind(this));
    }

    createColumnRenderer () {
        this.columnRenderer = new Jam.ColumnRenderer;
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
        this.filter.events.on('toggleActive', this.onActiveFilter.bind(this));
        this.$thead = this.grid.renderer.$thead;
        for (const cell of this.$thead.find('th')) {
            if (this.filter.getAttrParams(cell.dataset.name)) {
                $(cell).addClass('searchable');
            }
        }
        this.$thead.on('click', '.searchable .search-toggle', this.onSearchColumnToggle.bind(this));
    }

    onActiveFilter  (event, data) {
        this.$grid.toggleClass('active-advanced-search', data);
    }

    onSearchColumnToggle (event) {
        this.filter.toggle(true);
        this.filter.getEmptyCondition().setAttr($(event.currentTarget).closest('th').data('name'));
    }

    onCommand (event) {
        this.beforeCommand(event);
        const method = this.getCommandMethod(event.currentTarget.dataset.command);
        if (method) {
            method.call(this, event);
        }
    }

    getCommandMethod (name) {
        switch (name) {
            case 'view': return this.onView;
            case 'create': return this.onCreate;
            case 'clone': return this.onClone;
            case 'update': return this.onUpdate;
            case 'delete': return this.onDelete;
            case 'reload': return this.onReload;
            case 'sort': return this.onSort;
            case 'executeUrl': return this.onExecuteUrl;
            case 'selectAll': return this.onSelectAll;
        }
    }

    setDataGridParams () {
        this.params.columns.forEach(this.prepareColumnData, this);
        if (this.params.list) {
            this.params.ajax = {
                url: this.params.list,
                listAll: this.params.listAll
            };
        }
        this.params.overridenMethods = {
            isSearchableColumn: this.isSearchableColumn.bind(this)
        }
    }

    isSearchableColumn (name) {
        return !!this.filter.getAttrParams(name);
    }

    prepareColumnData (data) {
        data.render = this.columnRenderer.getRenderMethod(data.format);
        data.format = this.columnRenderer.prepareFormat(data.format);
    }

    createAlert () {
        return new Jam.Alert({
            container: $alert => this.$grid.prepend($alert),
            $scrollTo: this.$grid
        });
    }

    toggleLoader (state) {
        this.$grid.toggleClass('loading', state);
    }

    beforeLoad () {
        this.toggleLoader(true);
    }

    beforeXhr (event, data) {
        data.request.data.filter = this.filter.serialize();
    }

    afterLoad () {
        this.toggleLoader(false);
    }

    afterDrawPage () {
        this.prepareRows();
    }

    getListId () {
        return this.params.list;
    }

    getCloneParams () {
        return this.getObjectIdParam(...arguments);
    }

    prepareRows () {
        this.findRows().each((index, row) => {
            this.prepareRow(row, this.grid.getData(row.dataset.id), index);
        });
    }

    prepareRow () {
        if (typeof this[this.params.prepareRow] === 'function') {
            this[this.params.prepareRow](...arguments);
        }
    }

    redraw () {
        this.grid.drawPage();
    }

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
            : this.findCommand('update').click();
    }

    openNewPage () {
        const $row = this.getSelectedRow();
        if ($row) {
            const url = Jam.UrlHelper.addParams(this.getUpdateUrl(), this.getObjectIdParam($row));
            Jam.UrlHelper.openNewPageFrame(url);
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

    getSelectedRow (message = 'Select one item for action') {
        const $row = this.findSelectedRows();
        if ($row.length === 1) {
            return $row;
        }
        this.alert.warning(message);
    }

    getSelectedRows (message = 'Select items for action') {
        const $rows = this.findSelectedRows();
        if ($rows.length) {
            return $rows;
        }
        this.alert.warning(message);
    }

    findSelectedRows () {
        return this.findRows('.selected');
    }

    findRowById (id) {
        return this.grid.findRowById(id);
    }

    findRows (selector) {
        return this.grid.findRows(selector);
    }

    getCreateUrl () {
        return this.params.create;
    }

    getDeleteUrl () {
        return this.params.delete;
    }

    getUpdateUrl () {
        return this.params.update;
    }

    deleteObjects ($rows) {
        const ids = this.serializeObjectIds($rows);
        this.post(this.getDeleteUrl($rows), {ids}).done(this.onDoneDeletion.bind(this, ids));
    }

    onDoneDeletion (ids) {
        ids = ids.split(',');
        this.events.trigger('afterDelete', {ids});
        this.reload();
    }

    openFrame (url, params, afterClose, frameParams) {
        afterClose = afterClose || this.defaultFrameAfterClose;
        this._afterClose = afterClose.bind(this);
        this.childFrame.load(url, params, frameParams).done(this.addAfterCloseListener.bind(this));
    }

    addAfterCloseListener () {
        this.childFrame.one('afterClose', this._afterClose);
    }

    defaultFrameAfterClose (event, data) {
        if (!data) {
            return false;
        }
        if (data.reload) {
            return this.addAfterCloseListener();
        }
        if (!data.saved) {
            return false;
        }
        const id = data.result;
        if (data.reopen && id) {
            this.reopen(id);
        }
        this.reload();
        this.grid.events.one('afterDrawPage', this.onAfterDrawPage.bind(this, id));
    }

    onAfterDrawPage (id) {
        this.toggleRowSelect(this.findRowById(id), true);
    }

    reopen (id) {
        this.openFrame(this.getUpdateUrl(), {id});
    }

    post (url, data) {
        this.toggleLoader(true);
        this.xhr = Jam.post(url, data)
            .done(this.onDone.bind(this))
            .fail(this.onFail.bind(this));
        return this.xhr;
    }

    onDone () {
        this.toggleLoader(false);
    }

    onFail (data) {
        this.alert.danger(data.responseText || data.statusText);
        this.toggleLoader(false);
    }

    reload () {
        this.grid.load(...arguments);
    }

    findCommand (name) {
        return this.$commands.find(`[data-command="${name}"]`);
    }

    beforeCommand () {
        this.alert.hide();
    }

    onReload () {
        this.reload();
    }

    onView () {
        const $row = this.getSelectedRow();
        if ($row) {
            this.childFrame.load(this.params.view, this.getObjectIdParam($row));
        }
    }

    onCreate (event, params) {
        this.openFrame(this.getCreateUrl(), params);
    }

    onClone () {
        const $row = this.getSelectedRow();
        if ($row) {
            this.openFrame(this.params.clone, this.getCloneParams($row));
        }
    }

    onUpdate () {
        const $row = this.getSelectedRow();
        if ($row)  {
            this.openFrame(this.getUpdateUrl(), this.getObjectIdParam($row));
        }
    }

    onDelete () {
        const $rows = this.getSelectedRows();
        if ($rows) {
            Jam.dialog.confirmListDeletion().then(this.deleteObjects.bind(this, $rows));
        }
    }

    onSort () {
        this.modalSort = this.modalSort || new Jam.ListSort(this, this.params.modalSort);
        this.modalSort.execute();
    }

    onExecuteUrl (event) {
        let $btn = $(event.currentTarget);
        let selection = $btn.data('selection');
        let params = null;
        if (selection) {
            let $row = this.getSelectedRow();
            if (!$row) {
                return false;
            }
            params = this.getObjectIdParam($row);
        }
        const url = $btn.data('url');
        $btn.data('blank')
            ? Jam.UrlHelper.openNewPage(url, params)
            : this.openFrame(url, params);
    }

    onSelectAll () {
        this.toggleRowSelect(this.$tbody.children(), true);
    }
};

Jam.MainList = class MainList extends Jam.List {
};

Jam.FrameList = class FrameList extends Jam.List {

    init() {
        Object.assign(this.params, this.frame.initData);
        super.init();
        this.frame.findScrollHeader().append(this.$commands);
    }
};

Jam.TreeList = class TreeList extends Jam.List {

    createDataGrid () {
        this.grid = new Jam.TreeGrid(this.$grid, this.params);
    }
};

Jam.MainTreeList = class MainTreeList extends Jam.TreeList {

    onCreate (event) {
        const $row = this.findSelectedRows();
        if ($row.length !== 1) {
            return super.onCreate(event);
        }
        const node = this.grid.getNodeByRow($row);
        super.onCreate(event, {
            node: node.getId(),
            depth: node.getDepth()
        });
    }
};