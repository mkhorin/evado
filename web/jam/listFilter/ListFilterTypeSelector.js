/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
Jam.ListFilterTypeSelector = class ListFilterTypeSelector extends Jam.ListFilterType {

    init () {
        super.init();
        if (this.params.items) {
            this.createSimple();
        } else if (this.isAjax()) {
            this.createAjax();
        } else {
            this.deleteEqualOptions();
        }
        this.nested = new Jam.ListFilterNested(this);
    }

    isAjax () {
        return this.params.url && !this.params.items;
    }

    createSimple () {
        Jam.ObjectHelper.assignUndefined(this.params, {hasEmpty: true});
        const items = Jam.Helper.renderSelectOptions(this.params);
        this.getValueElement().html(items).select2();
    }

    createAjax () {
        this.params = {
            pageSize: 10,
            inputDelay: 500,
            minInputLength: 2,
            maxInputLength: 24,
            placeholder: '',
            valueType: 'id',
            ...this.params
        };
        this.getValueElement().select2({
            ajax: this.getAjaxParams(),
            allowClear: this.params.allowClear,
            placeholder: Jam.t(this.params.placeholder),
            minimumInputLength: this.params.minInputLength,
            maximumInputLength: this.params.maxInputLength,
            maximumSelectionLength: this.params.maxSelectionLength,
            minimumResultsForSearch: this.params.pageSize
        });
    }

    getAjaxParams () {
        return {
            type: 'POST',
            url: this.params.url,
            dataType: 'json',
            data: this.getQueryParams.bind(this),
            processResults: this.processResults.bind(this),
            delay: this.params.inputDelay,
            cache: true
        };
    }

    deleteEqualOptions () {
        const $select = this.condition.getOperationItem();
        $select.children().first().remove();
        $select.children().first().remove();
    }

    focus () {       
        if (this.getSelect2()) {
            this.getValueElement().select2('open');
        }
    }

    getQueryParams (params) {
        return {
            id: this.params.id,
            search: params.term,
            page: params.page,
            pageSize: this.params.pageSize
        };
    }

    processResults (data, params) {
        params.page = params.page || 1;
        const items = typeof data.items === 'object' ? data.items : data;
        const more = params.page * this.params.pageSize < data.total;
        return {
            pagination: {more},
            results: Jam.Helper.formatSelectItems(items)
        };
    }

    serialize (data) {
        return super.serialize(Object.assign(data, {
            relation: this.params.relation,
            text: this.getText()
        }));
    }

    getValue () {
        return this.nested.active() ? this.nested.getValue() : super.getValue();
    }

    getText () {
        return this.getValueElement().find(":selected").text();
    }

    changeValue (value, data) {
        if (this.nested.active()) {
            this.nested.parse(value);
        } else if (this.isAjax()) {
            this.changeAjaxValue(value, data);
        } else {
            this.setValue(value).change();
        }
        if (this.getSelect2()) {
            this.getValueElement().select2('close');
        }
    }

    changeAjaxValue (value, data) {
        const $select = this.getValueElement().select2('destroy');
        $select.empty().append(new Option(data.text, value, true, true));
        this.createAjax();
    }

    delete () {
        super.delete();
        this.nested.delete();
    }
};