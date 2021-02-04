/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
Jam.RelationSelectModelAttr = class RelationSelectModelAttr extends Jam.ModelAttr {

    constructor () {
        super(...arguments);
        this.$select = this.find('select');
        this.selectParams = this.$select.data('params');
        this.initChanges();
    }

    initChanges () {
        this.changes = {links: [], unlinks: [], deletes: []};
        this.initValues = [];
        const defaultValue = this.getValue();
        if (defaultValue) {
            this.changes.links = defaultValue.split(',');
        } else {
            for (const option of this.$select.children()) {
                this.initValues.push(option.getAttribute('value'));
            }
        }
        this.setValueByChanges();
    }

    activate () {
        if (!this.canActivate()) {
            return false;
        }
        this.activated = true;
        this.childFrame = Jam.frameStack.createFrame();
        this.params = {
            pageSize: 10,
            inputDelay: 500,
            minInputLength: 0,
            maxInputLength: 10,
            placeholder: '',
            ...this.selectParams
        };
        this.params.allowClear = !!this.params.unlink;
        this.$container = this.$value.closest('.relation-select');
        this.$commands = this.$container.children('.commands');
        this.alert = this.createAlert();
        this.select2ChoiceClass = '.select2-selection__choice';
        this.$container.mouseenter(this.showCommands.bind(this));
        this.$container.mouseleave(this.hideCommands.bind(this));
        this.$container.on('click', this.select2ChoiceClass, this.onClickSelect2Choice.bind(this));
        this.$container.on('dblclick', this.select2ChoiceClass, this.onDoubleClickSelect2Choice.bind(this));
        this.$select.change(this.onChangeSelect.bind(this));
        this.$container.on('click', '[data-command]', this.onCommand.bind(this));
        this.createSelect2();
        // this.getDefaultTitles();
        this.toggleBlank();
        this.bindDependencyChange();
    }

    getDefaultTitles () {
        let deferred = $.when();
        this.changes.links.forEach(id => {
            deferred = deferred.then(() => this.selectValue(id));
        });
    }

    hasValue () {
        const data = this.$select.val();
        return Array.isArray(data) ? data.length > 0 : !!data;
    }

    getLinkedValue () {
        const links = this.changes.links;
        return this.selectParams.multiple ? links : links[0];
    }

    getDependencyValue () {
        const data = this.$select.val();
        return !Array.isArray(data) || data.length ? data : null;
    }

    getValueText () {
        const data = this.$select.select2('data');
        return data.map(item => item.text).join();
    }

    getUpdateUrl () {
        return this.params.update;
    }

    clear () {
        this.changes.links = [];
        this.setValueByChanges();
        this.$select.val('').trigger('change.select2');
        this.toggleBlank();
    }

    setValue (value) {
        this.$value.val(value);
        this.toggleBlank();
    }

    setValueByChanges () {
        const value = this.hasChanges() ? JSON.stringify(this.changes) : '';
        if (this.$value.val() !== value) {
            this.$value.val(value);
            return true;
        }
    }

    createAlert () {
        return new Jam.Alert({
            container: $alert => this.$container.prepend($alert)
        });
    }

    createSelect2 () {
        const data = {
            allowClear: this.params.allowClear,
            placeholder: this.params.placeholder,
            minimumInputLength: this.params.minInputLength,
            maximumInputLength: this.params.maxInputLength,
            maximumSelectionLength: this.params.maxSelectionLength,
            minimumResultsForSearch: this.params.pageSize,
            readonly: true
        };
        if (this.params.list) {
            data.ajax = {
                type: 'POST',
                url: this.params.list,
                dataType: 'json',
                data: this.getRequestParams.bind(this),
                processResults: this.processResults.bind(this),
                delay: this.params.inputDelay,
                cache: true
            };
        }
        this.$select.select2(data);
        this.$select.data('select2').on('query', this.onQuery.bind(this));
    }

    onQuery () {
        if (this.params.list) {
            this.$select.data('select2').$results.find('li:not(:first)').hide();
        }
    }

    findCommand (name) {
        return this.$container.find(`[data-command="${name}"]`);
    }

    onCommand (event) {
        this.beforeCommand(event);
        this.getCommandMethod(event.currentTarget.dataset.command).call(this, event);
    }

    getCommandMethod (name) {
        switch (name) {
            case 'unlink': return this.onUnlink;
            case 'view': return this.onView;
            case 'create': return this.onCreate;
            case 'update': return this.onUpdate;
            case 'delete': return this.onDelete;
            case 'sort': return this.onSort;
        }
    }

    beforeCommand () {
        this.alert.hide();
        this.model.beforeCommand();
    }

    getRequestParams (data) {
        return {
            search: data.term,
            page: data.page,
            pageSize: this.params.pageSize,
            dependency: this.getDependencyData()
        };
    }

    getDependencyData () {
        return this.model.getDependencyData(this);
    }

    processResults (data, params) {
        params.page = params.page || 1;
        return {
            pagination: {
                more: params.page * this.params.pageSize < data.total
            },
            results: Jam.Helper.formatSelectItems(data.items)
        };
    }

    getMultipleSelectedValues () {
        const values = this.getSelectedValues();
        if (values.length) {
            return values;
        }
        this.alert.warning('Select items for action')
    }

    getOneSelectedValue () {
        const values = this.getSelectedValues();
        if (values.length === 1) {
            return values[0];
        }
        this.alert.warning('Select one item for action')
    }

    getSelectedValues () {
        const data = this.$select.val();
        if (!Array.isArray(data)) {
            return data ? [data] : [];
        }
        const $items = this.getSelect2ChoiceItems();
        return data.filter((value, index) => $items.eq(index).is('.active'));
    }

    getSelect2ChoiceItems () {
        return this.$container.find(this.select2ChoiceClass);
    }

    onClickSelect2Choice (event) {
        if (event.ctrlKey) {
            $(event.currentTarget).toggleClass('active');
        } else {
            this.getSelect2ChoiceItems().removeClass('active');
            $(event.currentTarget).addClass('active');
        }
        this.$select.select2('close');
    }

    onDoubleClickSelect2Choice (event) {
        $(event.currentTarget).addClass('active');
        this.findCommand('update').click();
    }

    hasChanges () {
        return this.changes.links.length
            || this.changes.unlinks.length
            || this.changes.deletes.length;
    }

    onChangeSelect () {
        this.changes.links = [];
        const value = this.$select.val();
        if (Array.isArray(value)) {
            value.forEach(this.linkValue, this);
        } else {
            if (value) {
                this.linkValue(value);
            }
            this.unlinkCurrentValue(value);
        }
        if (this.setValueByChanges()) {
            this.triggerChange();
        }
        this.toggleBlank();
    }

    linkValue (value) {
        if (!this.initValues.includes(value)) {
            this.changes.links.push(value);
        }
        Jam.ArrayHelper.remove(value, this.changes.unlinks);
        Jam.ArrayHelper.remove(value, this.changes.deletes);
    }

    unlinkCurrentValue (value) {
        const values = this.initValues;
        if (values.length && !values.includes(value) && !this.changes.deletes.includes(values[0])) {
            this.changes.unlinks = [values[0]];
        }
    }

    showCommands () {
        this.$container.addClass('show-commands');
    }

    hideCommands () {
        this.$container.removeClass('show-commands');
        this.alert.hide();
    }

    onDependencyChange () {
        this.clear();
    }

    onUnlink () {
        const values = this.getMultipleSelectedValues();
        if (values) {
            this.unlink(values);
        }
    }

    onView () {
        const id = this.getOneSelectedValue();
        if (id) {
            this.openFrame(this.params.view, {id});
        }
    }

    onCreate () {
        this.openFrame(this.params.create);
    }

    onUpdate () {
        const id = this.getOneSelectedValue();
        if (id) {
            this.openFrame(this.getUpdateUrl(), {id});
        }
    }

    onDelete () {
        const values = this.getMultipleSelectedValues();
        if (values) {
            const deferred = this.params.confirmDeletion
                ? Jam.dialog.confirmListDeletion()
                : null;
            $.when(deferred).then(() => this.delete(values));
        }
    }

    onSort () {
        this.openFrame(this.params.modalSort, null, ()=>{});
    }

    unlink (values) {
        for (const value of values) {
            if (this.initValues.includes(value)) {
                this.changes.unlinks.push(value);
            }
            this.removeSelect2Value(value);
        }
    }

    delete (values) {
        for (const value of values) {
            if (this.initValues.includes(value)) {
                this.changes.deletes.push(value);
            }
            this.removeSelect2Value(value);
        }
    }

    removeSelect2Value (id) {
        const value = this.$select.val();
        if (Array.isArray(value)) {
            value.splice(value.indexOf(id), 1);
            this.$select.val(value).change();
        } else {
            this.$select.val(null).change();
        }
    }

    openFrame (url, params, afterClose) {
        afterClose = afterClose || this.defaultAfterCloseModal;
        this._afterClose = afterClose.bind(this);
        this.childFrame.load(url, params).done(this.addAfterCloseListener.bind(this));
    }

    addAfterCloseListener () {
        this.childFrame.one('afterClose', this._afterClose);
    }

    defaultAfterCloseModal (event, data) {
        if (!data) {
            return false;
        }
        if (data.reload) {
            return this.addAfterCloseListener();
        }
        const id = data.result;
        if (!id) {
            return false;
        }
        if (data.saved) {
            this.selectValue(id);
        }
        if (data.reopen) {
            this.openFrame(this.getUpdateUrl(), {id});
        }
    }

    selectValue (id) {
        return $.get(this.params.viewTitle, {id}).done(this.parseSelectedValue.bind(this, id));
    }

    parseSelectedValue (id, data) {
        const $item = this.$select.children(`[value="${id}"]`);
        if ($item.length) {
            $item.html(data);
            this.$select.select2('destroy');
            this.createSelect2();
        } else {
            this.$select.append(new Option(data, id, true, true)).change();
        }
    }

    sortByIdList (ids) {
        const data = Jam.ArrayHelper.flip(ids);
        this.$select.children().sort((a, b) => data[a.value] - data[b.value]).appendTo(this.$select);
    }
};