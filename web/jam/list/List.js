/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
Jam.List = class List extends Jam.Element {

    constructor ($element, data) {
        super(...arguments);
        Object.assign(this, data);
        this.$grid = $element;
        this.params = Object.assign(this.getDefaultParams(), this.$grid.data('params'));
        this.multiple = this.params.multiple;
        this.prepareFrames();
        this.events = new Jam.Events('List');
        this.alert = this.createAlert();
    }

    getDefaultParams () {
        return {
            multiple: true
        };
    }

    prepareFrames () {
        this.$frame = this.$grid.closest('.stack-frame');
        this.frame = this.$frame.data('frame');
        this.childFrame = Jam.frameStack.createFrame();
    }

    init () {
        this.createDataFormatter();
        this.setDataGridParams();
        this.createDataGrid();
        this.params.loadOnDemand
            ? this.setLoadOnDemand()
            : this.activate();
    }

    setLoadOnDemand () {
        this.$grid.on('click', '.btn-demand-load', this.activate.bind(this));
        this.addClass('demand-load');
    }

    activate () {
        this.prepareCommands();
        this.initDataGrid();
        this.createFilter();
        this.grid.init();
        this.grid.addItemListener('click', this.onClickItem.bind(this));
        this.grid.addItemListener('dblclick', this.onDoubleClickItem.bind(this));
        this.removeClass('demand-load');
    }

    prepareCommands () {
        this.$commands = this.$grid.children('.commands');
        this.addFrameCommands();
        Jam.Helper.sortChildrenByInteger(this.$commands);
        this.$commands.on('click', '[data-command]', this.onCommand.bind(this));
    }

    addFrameCommands () {
        this.$commands.prepend(this.$frame.find('.prepend-commands').children());
        this.$commands.append(this.$frame.find('.append-commands').children());
    }

    createDataFormatter () {
        this.dataFormatter = new Jam.ListDataFormatter;
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
            this.addClass('has-advanced-search');
            this.filter.events.on('afterBuild', this.onBuildFilter.bind(this));
        }
    }

    onBuildFilter () {
        this.filter.events.on('toggleActive', this.onActiveFilter.bind(this));
        for (const name of this.filter.getAttrNames()) {
            this.grid.renderer.findHeadByName(name).addClass('searchable');
        }
        this.grid.addListener('click', '.searchable .search-toggle', this.onFilterAttr.bind(this));
    }

    onActiveFilter  (event, data) {
        this.toggleClass('active-advanced-search', !!data);
    }

    onFilterAttr (event) {
        this.filter.toggle(true);
        const name = $(event.currentTarget).closest('[data-name]').data('name');
        this.filter.getEmptyCondition().setAttr(name);
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
        data.render = this.dataFormatter.getRenderingMethod(data.format);
        data.format = this.dataFormatter.prepareFormat(data.format);
    }

    createAlert () {
        return new Jam.Alert({
            container: $alert => this.$grid.prepend($alert),
            $scrollTo: this.$grid
        });
    }

    toggleLoader (state) {
        this.toggleClass('loading', state);
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
        this.prepareItems();
    }

    getListId () {
        return this.params.list;
    }

    getCloneParams () {
        return this.getObjectIdParam(...arguments);
    }

    prepareItems () {
        this.findItems().each((index, item) => {
            this.prepareItem(item, this.grid.getData(item.dataset.id), index);
        });
    }

    prepareItem () {
        if (typeof this[this.params.prepareItem] === 'function') {
            this[this.params.prepareItem](...arguments);
        }
    }

    redraw () {
        this.grid.drawPage();
    }

    onClickItem (event) {
        if ($(event.target).closest('a').length) {
            return true;
        }  
        if (!this.multiple || !event.ctrlKey) {
            this.deselectExceptOneItem(event.currentTarget);
        }
        this.toggleItemSelect($(event.currentTarget), event.ctrlKey ? undefined : true);
    }

    onDoubleClickItem (event) {
        if ($(event.target).closest('a').length) {
            return true;
        }
        this.deselectExceptOneItem(event.currentTarget);
        this.toggleItemSelect($(event.currentTarget), true);
        event.ctrlKey
            ? this.openNewPage()
            : this.findCommand('update').click();
    }

    openNewPage () {
        const $item = this.getSelectedItem();
        if ($item) {
            const url = Jam.UrlHelper.addParams(this.getUpdateUrl(), this.getObjectIdParam($item));
            Jam.UrlHelper.openNewPageFrame(url);
        }
    }

    deselectExceptOneItem ($item) {
        this.toggleItemSelect(this.findSelectedItems().not($item), false);
    }

    toggleItemSelect ($item, state) {
        $item.toggleClass('selected', state);
    }

    getObjectIdParam ($items) {
        return {id: this.getObjectIds($items)[0]};
    }

    getObjectIds ($items) {
        return $items.get().map(item => item.dataset.id);
    }

    getObjectValues (name, $items) {
        return this.grid.getItemData($items, name);
    }

    serializeObjectIds ($items) {
        return $items ? this.getObjectIds($items).join() : '';
    }

    getSelectedItem (message = 'Select one item for action') {
        const $item = this.findSelectedItems();
        if ($item.length === 1) {
            return $item;
        }
        this.alert.warning(message);
    }

    getSelectedItems (message = 'Select items for action') {
        const $items = this.findSelectedItems();
        if ($items.length) {
            return $items;
        }
        this.alert.warning(message);
    }

    findSelectedItems () {
        return this.findItems('.selected');
    }

    findItemById (id) {
        return this.grid.findItemById(id);
    }

    findItems (selector) {
        return this.grid.findItems(selector);
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

    deleteObjects ($items) {
        const ids = this.serializeObjectIds($items);
        this.post(this.getDeleteUrl($items), {ids}).done(this.onDoneDeletion.bind(this, ids));
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
        this.toggleItemSelect(this.findItemById(id), true);
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
        const $item = this.getSelectedItem();
        if ($item) {
            this.childFrame.load(this.params.view, this.getObjectIdParam($item));
        }
    }

    onCreate (event, params) {
        this.openFrame(this.getCreateUrl(), params);
    }

    onClone () {
        const $item = this.getSelectedItem();
        if ($item) {
            this.openFrame(this.params.clone, this.getCloneParams($item));
        }
    }

    onUpdate () {
        const $item = this.getSelectedItem();
        if ($item)  {
            this.openFrame(this.getUpdateUrl(), this.getObjectIdParam($item));
        }
    }

    onDelete () {
        const $items = this.getSelectedItems();
        if ($items) {
            Jam.dialog.confirmListDeletion().then(this.deleteObjects.bind(this, $items));
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
            let $item = this.getSelectedItem();
            if (!$item) {
                return false;
            }
            params = this.getObjectIdParam($item);
        }
        const url = $btn.data('url');
        $btn.data('blank')
            ? Jam.UrlHelper.openNewPage(url, params)
            : this.openFrame(url, params);
    }

    onSelectAll () {
        this.toggleItemSelect(this.grid.findItems(), true);
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
        const $item = this.findSelectedItems();
        if ($item.length !== 1) {
            return super.onCreate(event);
        }
        const node = this.grid.getNodeByItem($item);
        super.onCreate(event, {
            node: node.getId(),
            depth: node.getDepth()
        });
    }
};