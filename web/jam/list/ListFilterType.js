/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
Jam.ListFilterType = class ListFilterType {

    constructor (params, condition) {
        this.condition = condition;
        this.filter = condition.filter;
        this.name = params.type;
        this.params = {
            ...this.filter.getTypeParams(this.name),
            ...params
        };
        this.init();
    }

    init () {
        this.append();
    }

    getSelect2 () {
        return this.getValueItem().data('select2');
    }

    getValue () {
        return $.trim(this.getValueItem().val());
    }

    setValue (value) {
        return this.getValueItem().val(value);
    }

    changeValue (value) {
        return this.setValue(value);
    }

    getValueItem () {
        return this.condition.getValueItem();
    }

    append () {
        this.$container = $(this.filter.$typeSamples.children(`[data-id="${this.name}"]`).html());
        this.condition.$attrContainer.after(this.$container);
    }

    focus () {
        this.condition.$container.find('.default-focus').focus();
    }

    delete () {
        this.condition.$attrContainer.nextAll().remove();
    }

    getRequestData (data) {
        return Object.assign(data, {
            type: this.name,
            inline: this.params.inline,
            valueType: this.params.valueType
        });
    }
};

Jam.StringListFilterType = class ListFilterStringType extends Jam.ListFilterType {

    constructor (params) {
        params.type = params.type || 'string';
        super(...arguments);
    }

    init () {
        super.init();
        this.getValueItem().keyup(this.onKeyUp.bind(this));
    }

    onKeyUp (event) {
        if (event.key === 'Enter' && this.getValue().length) {
            this.filter.onApply();
        }
    }
};

Jam.BooleanListFilterType = class ListFilterBooleanType extends Jam.ListFilterType {

    init () {
        super.init();
        this.getValueItem().change(this.onChangeValue.bind(this));
        this.changeValue();
    }

    onChangeValue () {
        this.setValue(this.getValueItem().is(':checked') ? 'true' : 'false');
    }

    changeValue (value) {
        return this.setValue(value).prop('checked', value === 'true');
    }
};

Jam.DateListFilterType = class DateListFilterType extends Jam.ListFilterType {

    init () {
        super.init();
        this.$picker = this.$container.find('.datepicker');
        this.$picker.datetimepicker({
            ...$.fn.datetimepicker.defaultOptions,
            ...this.filter.params.datepicker,
            format: Jam.DateHelper.getMomentFormat(this.getFormat()),
            widgetParent: this.$picker.parent()
        });
        this.picker = this.$picker.data('DateTimePicker');
        this.$picker.on('dp.change', this.onChangeDate.bind(this));
    }

    getFormat () {
        return this.params.format || 'date';
    }

    onChangeDate (event) {
        let date = event.date;
        let format = this.picker.options().format;
        // if date format then remove time
        date = date && moment(moment(date).format(format), format);
        this.setValue(date ? Jam.DateHelper.stringify(date, this.params.utc) : '');
        if (!date) {
            this.picker.hide();
        }
    }

    changeValue (value) {
        this.picker.date(new Date(value));
    }
};

Jam.DatetimeListFilterType = class DatetimeListFilterType extends Jam.DateListFilterType {

    getFormat () {
        return this.params.format || 'datetime';
    }
};

Jam.IdListFilterType = class IdListFilterType extends Jam.StringListFilterType {

    init () {
        super.init();
        this.nested = new Jam.NestedListFilter(this);
    }

    getValue () {
        return this.nested.active() ? this.nested.getValue() : super.getValue();
    }

    delete () {
        super.delete();
        this.nested.delete();
    }

    changeValue (value) {
        return this.nested.active() ? this.nested.parse(value) : this.setValue(value);
    }
};

Jam.SelectorListFilterType = class SelectorListFilterType extends Jam.ListFilterType {

    init () {
        super.init();
        if (this.params.items) {
            this.createSimple();
        } else if (this.isAjax()) {
            this.createAjax();
        } else {
            this.deleteEqualOptions();
        }
        this.nested = new Jam.NestedListFilter(this);
    }

    isAjax () {
        return this.params.url && !this.params.items;
    }

    createSimple () {
        Jam.ObjectHelper.assignUndefined(this.params, {hasEmpty: true});
        const items = Jam.Helper.renderSelectOptions(this.params);
        this.getValueItem().html(items).select2();
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
        this.getValueItem().select2({
            ajax: this.getAjaxParams(),
            allowClear: this.params.allowClear,
            placeholder: this.params.placeholder,
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
            this.getValueItem().select2('open');
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

    getRequestData (data) {
        return super.getRequestData(Object.assign(data, {
            relation: this.params.relation,
            text: this.getText()
        }));
    }

    getValue () {
        return this.nested.active() ? this.nested.getValue() : super.getValue();
    }

    getText () {
        return this.getValueItem().find(":selected").text();
    }

    changeValue (value) {
        if (this.nested.active()) {
            this.nested.parse(value);
        } else if (this.isAjax()) {
            this.changeAjaxValue(...arguments);
        } else {
            this.setValue(value).change();
        }
        if (this.getSelect2()) {
            this.getValueItem().select2('close');
        }
    }

    changeAjaxValue (value, text) {
        const $select = this.getValueItem().select2('destroy');
        $select.empty().append(new Option(text, value, true, true));
        this.createAjax();
    }

    delete () {
        super.delete();
        this.nested.delete();
    }
};

Jam.NestedListFilter = class NestedListFilter {

    constructor (type) {
        this.type = type;
        this.condition = type.condition;
        this.filter = type.filter;
        this.params = type.params;
        this.resolve();
        this.condition.getOperationItem().change(this.onChangeOperation.bind(this));
        this.onChangeOperation();
    }

    active () {
        return this.condition.getOperation() === 'nested';
    }

    resolve () {
        const columns = this.params.columns;
        if (!Array.isArray(columns) || !columns.length) {
            // delete nested option
            return this.condition.getOperationItem().children().last().remove();
        }
        this.group = new Jam.ListFilterGroup(this.filter, columns);
        this.condition.$groupContainer.html(this.group.$container);
        this.$addCondition = this.condition.$content.find('.add-condition');
        this.$addCondition.click(this.onAddCondition.bind(this));
    }

    onChangeOperation () {
        this.toggle(this.active());
    }

    onAddCondition () {
        this.group.addCondition();
    }

    toggle (state) {
        this.condition.$container.toggleClass('has-nested', state);
    }

    getValue () {
        return this.group.serialize();
    }

    delete () {
        this.condition.$groupContainer.html('');
    }

    parse (items) {
        for (const item of items) {
            this.group.addCondition().parse(item);
        }
    }
};