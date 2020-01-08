/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

Jam.ListFilter = class ListFilter {

    constructor (list, params) {
        this.list = list;
        this.conditions = [];
        this.params = {...params};
        this.$container = list.$content.find('.list-filter');
        if (this.isExists()) {
            this.init();
        }
    }

    init () {
        this.params = Object.assign(this.params, this.$container.data('params'));
        this.events = new Jam.Events('ListFilter');
    }

    isExists () {
        return this.$container.length > 0;
    }

    isVisible () {
        return this.$container.is(':visible');
    }

    toggle (state) {
        this.$container.toggle(state);
        this.load();
        if (this.isVisible() && this.group && this.group.isEmpty()) {
            this.onAddCondition();
        }
    }

    load () {
        if (!this._xhr) {
            this._xhr = $.get(this.params.url).done(this.build.bind(this));
        }
    }

    build (content) {
        const $content = $(content).filter('.list-filter');
        Jam.i18n.translateContainer($content);
        this.params = Object.assign(this.params, $content.data('params'));
        this.$container.html($content.html());
        this.$groupSample = this.$container.children('.filter-group');
        this.$conditionSample = this.$container.children('.filter-condition');
        this.$typeSamples = this.$container.children('.filter-types');
        this.$content = this.$container.children('.filter-content');
        this.group = new Jam.ListFilterGroup(this, this.params.columns);
        this.$content.append(this.group.$container);
        this.$commands = this.$container.children('.filter-commands');
        this.$commands.find('.add').click(this.onAddCondition.bind(this));
        this.$apply = this.$commands.find('.apply').click(this.onApply.bind(this));
        this.$commands.find('.reset').click(this.onReset.bind(this));
        this.onAddCondition();
        this.store = new Jam.ListFilterStore(this);
        this.events.trigger('afterBuild');
    }

    getAttrParams (name) {
        return this.group && this.group.getAttrParams(name);
    }

    getTypeParams (id) {
        return this.params.types && this.params.types[id];
    }

    getEmptyCondition () {
        return this.group.getEmptyCondition();
    }

    onApply () {
        this._applied = true;
        this.list.reload({resetPage: true});
        this.triggerActive();
    }

    onReset () {
        this.group.reset();
        this.$container.hide();
        this.triggerActive();
        if (this._applied) {
            this.list.reload({resetPage: true});
            this._applied = false;
        }
    }

    onAddCondition () {
        return this.group.addCondition();
    }

    triggerActive () {
        const hasData = !!this.serialize();
        this.$container.toggleClass('active', hasData);
        this.events.trigger('toggleActive', hasData);
    }

    serialize () {
        return this.group ? this.group.serialize() : undefined;
    }

    parse (items) {
        this.group.reset();
        for (const item of items) {
            this.group.addCondition().parse(item);
        }
        this.onApply();
        this.$apply.focus();
    }
};

// GROUP

Jam.ListFilterGroup = class ListFilterGroup {

    constructor (filter, columns) {
        this.filter = filter;
        this.columns = columns;
        this.events = new Jam.Events(this.constructor.name);
        this.$container = filter.$groupSample.clone().removeClass('hidden');
        this.conditions = [];
    }

    isEmpty () {
        return this.conditions.length === 0;
    }

    getAttrParams (name) {
        return Jam.ArrayHelper.getByNestedValue(name, 'name', this.columns);
    }

    getEmptyCondition () {
        const condition = this.conditions[this.conditions.length - 1];
        return condition && !condition.getAttr()
            ? condition
            : this.addCondition();
    }

    addCondition () {
        const condition = this.createCondition();
        this.conditions.push(condition);
        this.$container.append(condition.$container);
        return condition;
    }

    createCondition () {
        return new Jam.ListFilterCondition(this);
    }

    reset () {
        this.conditions = [];
        this.$container.empty();
    }

    serialize () {
        let result = this.conditions.map(condition => condition.serialize());
        result = result.filter(value => value);
        return result.length ? result : undefined;
    }

    afterDeleteCondition (condition) {
        Jam.ArrayHelper.removeValue(condition, this.conditions);
    }
};

// CONDITION

Jam.ListFilterCondition = class ListFilterCondition {

    static createAttrItems (columns) {
        let result = '<option></option>';
        for (let {name, label, translate} of columns) {
            if (label === undefined) {
                label = name;
            } else if (translate !== false) {
                label = Jam.i18n.translate(label, translate);
            }
            result += `<option value="${name}">${label}</option>`;
        }
        return result;
    }

    constructor (group) {
        this.group = group;
        this.filter = group.filter;
        this.events = new Jam.Events(this.constructor.name);
        this.$container = this.filter.$conditionSample.clone().removeClass('hidden');
        this.$container.data('condition', this);
        this.setAnd(true);
        this.$content = this.$container.children('.condition-content');
        this.$groupContainer = this.$container.children('.condition-group');
        this.$attrContainer = this.$content.find('.condition-attr-container');
        this.$attrSelect = this.$attrContainer.find('.condition-attr');
        this.$attrSelect.change(this.onChangeAttr.bind(this));
        this.$container.find('.delete-condition').click(this.onDelete.bind(this));
        this.$container.find('.condition-logical').click(this.onToggleLogical.bind(this));
        this.$attrSelect.html(this.constructor.createAttrItems(this.group.columns)).select2();
    }

    getAttr () {
        return this.$attrSelect.val();
    }

    setAttr (name) {
        this.$attrSelect.val(name).change();
    }

    onChangeAttr () {
        this.deleteType();
        const params = this.group.getAttrParams(this.getAttr());
        if (params) {
            this.type = this.createType(params);
            this.type.focus();
        }
    }

    createType (params) {
        let type = 'String';
        switch (params.type) {
            case 'boolean': type = 'Boolean'; break;
            case 'date': type = 'Date'; break;
            case 'id': type = 'Id'; break;
            case 'selector': type = 'Selector'; break;
        }
        return new Jam[`ListFilter${type}Type`](params, this);
    }

    getOperation () {
        return this.getOperationItem().val();
    }

    setOperation (value) {
        return this.getOperationItem().val(value).change();
    }

    getOperationItem () {
        return this.$container.find('.condition-operation');
    }

    getValue () {
        return this.type ? this.type.getValue() : undefined;
    }

    getValueItem () {
        return this.$container.children('.condition-content').find('.condition-value');
    }

    onToggleLogical () {
        this.setAnd(!this.and);
    }

    setAnd (and) {
        this.and = and;
        this.$container.removeClass(this.and ? 'or' : 'and');
        this.$container.addClass(this.and ? 'and' : 'or');
    }

    deleteType () {
        if (this.type) {
            this.type.delete();
            this.type = null;
        }
    }

    onDelete () {
        this.$container.remove();
        this.group.afterDeleteCondition(this);
    }

    serialize () {
        const op = this.getOperation();
        const value = this.getValue();
        if (op && value !== undefined) {
            const and = this.and;
            const attr = this.getAttr();
            return this.type.getRequestData({and, attr, op, value});
        }
    }

    parse (data) {
        this.setAnd(data.and);
        this.$attrSelect.val(data.attr).change();
        this.setOperation(data.op);
        this.type.changeValue(data.value, data.text);
    }
};

// TYPE

Jam.ListFilterType = class ListFilterType {

    constructor (params, condition) {
        this.condition = condition;
        this.filter = condition.filter;
        this.name = params.type;
        this.params = {
            ...params,
            ...this.filter.getTypeParams(this.name)
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
        this.condition.$attrContainer.nextAll().delete();
    }

    getRequestData (data) {
        return Object.assign(data, {
            type: this.name,
            inline: this.params.inline,
            valueType: this.params.valueType
        });
    }
};

// STRING

Jam.ListFilterStringType = class ListFilterStringType extends Jam.ListFilterType {

    constructor (params) {
        params.type = params.type || 'string';
        super(...arguments);
    }

    init () {
        super.init();
        this.getValueItem().keyup(this.onKeyUp.bind(this));
    }

    onKeyUp (event) {
        if (event.keyCode === 13 && this.getValue().length) {
            this.filter.onApply();
        }
    }
};

// BOOLEAN

Jam.ListFilterBooleanType = class ListFilterBooleanType extends Jam.ListFilterType {

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

// DATE

Jam.ListFilterDateType = class ListFilterDateType extends Jam.ListFilterType {

    init () {
        super.init();
        this.$picker = this.$container.find('.datepicker');
        this.$picker.datetimepicker({
            ...$.fn.datetimepicker.defaultOptions,
            ...this.filter.params.datepicker,
            format: this.params.format || 'L',
            widgetParent: this.$picker.parent()
        });
        this.picker = this.$picker.data('DateTimePicker');
        this.$picker.on('dp.change', this.onChangeDate.bind(this));
    }

    onChangeDate (event) {
        let date = event.date;
        let format = this.picker.options().format;
        // reformat date to delete time on select day only
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

// ID

Jam.ListFilterIdType = class ListFilterIdType extends Jam.ListFilterStringType {

    init () {
        super.init();
        this.nested = new Jam.ListFilterNested(this);
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

// SELECTOR

Jam.ListFilterSelectorType = class SelectorType extends Jam.ListFilterType {

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
        return this.params.url;
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
            minInputLength: 1,
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
        //super.focus();
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
        return {
            pagination: {more: (params.page * this.params.pageSize) < data.total},
            results: data.items
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

// NESTED

Jam.ListFilterNested = class ListFilterNested {

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
            return this.condition.getOperationItem().children().last().remove(); // delete nested option
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