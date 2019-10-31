/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

Jam.ModelAttrRelationSelect = class ModelAttrRelationSelect extends Jam.ModelAttr {

    activate () {
        if (!this.canActivate()) {
            return false;
        }
        this.activated = true;
        this.initBase();
        this.initChanges();
        this.createSelect2();
    }

    initBase () {
        this.childModal = Jam.modal.create();
        this.$select = this.$attr.find('select');
        this.params = {
            pageSize: 10,
            inputDelay: 500,
            minInputLength: 0,
            maxInputLength: 10,
            placeholder: '',
            ...this.$select.data('params')
        };
        this.$container = this.$value.closest('.box');
        this.$content = this.$container.children('.box-body');
        this.$controls = this.$content.children('.list-controls');
        this.notice = new Jam.Notice({container: $notice => this.$content.prepend($notice)});
        this.select2ChoiceClass = '.select2-selection__choice';
        this.$container.mouseenter(this.showMouseEnter.bind(this));
        this.$container.mouseleave(this.hideMouseEnter.bind(this));
        this.$container.on('click', this.select2ChoiceClass, this.onClickSelect2Choice.bind(this));
        this.$container.on('dblclick', this.select2ChoiceClass, this.onDoubleClickSelect2Choice.bind(this));
        this.$select.change(this.changeSelect.bind(this));
        this.$controls.on('click', '[data-id]', this.onControl.bind(this));
    }

    initChanges () {
        this.changes = {links: [], unlinks: [], removes: []};
        this.startValues = [];
        for (const option of this.$select.children()) {
            this.startValues.push(option.getAttribute('value'));
        }
        Object.assign(this.changes, Jam.Helper.parseJson(this.getValue()));
        if (this.changes.links.length) {
            this.selectValue(this.changes.links[0]).done(()=> {
                this.model.setInitValue();
            });
        }
    }

    setValue (value) {
        this.$value.val(value).trigger('change.select2');
    }

    createSelect2 () {
        this.$select.select2({
            ajax: {
                type: 'POST',
                url: this.params.list,
                dataType: 'json',
                data: this.getQueryParams.bind(this),
                processResults: this.processResults.bind(this),
                delay: this.params.inputDelay,
                cache: true
            },
            allowClear: this.params.allowClear,
            placeholder: this.params.placeholder,
            minimumInputLength: this.params.minInputLength,
            maximumInputLength: this.params.maxInputLength,
            maximumSelectionLength: this.params.maxSelectionLength,
            minimumResultsForSearch: this.params.pageSize,
            readonly: true
        });
    }

    getControl (id) {
        return this.$controls.find(`[data-id="${id}"]`);
    }

    onControl (event) {
        this.beforeControl(event);
        this.getControlMethod(event.currentTarget.dataset.id).call(this, event);
    }

    getControlMethod (id) {
        switch (id) {
            case 'unlink': return this.onUnlink;
            case 'view': return this.onView;
            case 'create': return this.onCreate;
            case 'update': return this.onUpdate;
            case 'remove': return this.onRemove;
            case 'sort': return this.onSort;
        }
    }

    beforeControl () {
        this.notice.hide();
        this.model.beforeControl();
    }

    getQueryParams (data) {
        return {
            search: data.term,
            page: data.page,
            pageSize: this.params.pageSize
        };
    }

    processResults (data, params) {
        params.page = params.page || 1;
        return {
            pagination: {more: (params.page * this.params.pageSize) < data.total},
            results: data.items
        };
    }

    getSelectedValues () {
        const values = this.$select.val();
        if (!Array.isArray(values)) {
            return [];
        }
        const $items = this.getSelect2ChoiceItems();
        return values.filter((value, index)=> {
            return $items.eq(index).is('.active');
        });
    }

    getOneSelectedValue () {
        const values = this.getSelectedValues();
        if (values.length === 1) {
            return values[0];
        }
        this.notice.warning('Select one item for action')
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
        this.getControl('update').click();
    }

    hasChanges () {
        return this.changes.links.length
            || this.changes.unlinks.length
            || this.changes.removes.length;
    }

    changeSelect () {
        this.changes.links = [];
        let value = this.$select.val();
        if (Array.isArray(value)) {
            value.forEach(this.linkValue.bind(this));
        } else {
            if (value) {
                this.linkValue(value);
            }
            if (!this.startValues.includes(value) && this.startValues.length
                && !this.changes.removes.includes(this.startValues[0])) {
                this.changes.unlinks = [this.startValues[0]];
            }
        }
        value = this.hasChanges() ? JSON.stringify(this.changes) : '';
        if (this.$value.val() !== value) {
            this.$value.val(value).change();
        }
    }

    linkValue (value) {
        if (!this.startValues.includes(value)) {
            this.changes.links.push(value);
        }
        Jam.ArrayHelper.removeValue(value, this.changes.unlinks);
        Jam.ArrayHelper.removeValue(value, this.changes.removes);
    }

    showMouseEnter () {
        this.$container.addClass('mouse-enter');
    }

    hideMouseEnter () {
        this.$container.removeClass('mouse-enter');
        this.notice.hide();
    }

    onUnlink () {
        this.unlink(this.getSelectedValues());
    }

    onView () {
        const id = this.getOneSelectedValue();
        if (id) {
            this.loadModal(this.params.view, {id});
        }
    }

    onCreate () {
        this.loadModal(this.params.create);
    }

    onUpdate () {
        const id = this.getOneSelectedValue();
        if (id) {
            this.loadModal(this.params.update, {id});
        }
    }

    onRemove () {
        const values = this.getSelectedValues();
        if (values.length) {
            Jam.dialog.confirmRemove('Delete selected items?')
                .then(this.remove.bind(this, values));
        }
    }

    onSort () {
        this.loadModal(this.params.modalSort, null, ()=> {});
    }

    unlink (values) {
        for (const value of values) {
            if (this.startValues.includes(value)) {
                this.changes.unlinks.push(value);
            }
            this.removeSelect2Value(value);
        }
    }

    remove (values) {
        for (const value of values) {
            if (this.startValues.includes(value)) {
                this.changes.removes.push(value);
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

    loadModal (url, params, afterClose) {
        afterClose = afterClose || this.defaultAfterCloseModal;
        this.childModal.load(url, params).done(()=> {
            this.childModal.one('afterClose', afterClose.bind(this));
        });
    }

    defaultAfterCloseModal (event, data) {
        if (data && data.result) {
            this.selectValue(data.result);
            if (data.reopen) {
                this.loadModal(this.params.update, {id: data.result});
            }
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
        const map = Jam.ArrayHelper.flip(ids);
        this.$select.children().sort((a, b)=> map[a.value] - map[b.value]).appendTo(this.$select);
    }
};