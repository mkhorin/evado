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
            this.addCondition();
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
        this.group = new Jam.ListFilter.Group(this, this.params.columns);
        this.$content.append(this.group.$container);
        //this.$tools = this.$container.children('.filter-tools');
        this.$controls = this.$container.children('.filter-controls');
        this.$controls.find('.add-condition').click(this.addCondition.bind(this));
        this.$controls.find('.apply-filter').click(this.apply.bind(this));
        this.$controls.find('.reset-filter').click(this.reset.bind(this));
        this.addCondition();
        this.events.trigger('afterBuild');
    }

    getAttrParams (name) {
        return this.group && this.group.getAttrParams(name);
    }

    getTypeParams (id) {
        return this.params.types && this.params.types[id];
    }

    apply () {
        this._applied = true;
        this.list.reload({resetPage: true});
        this.triggerActive();
    }

    serialize () {
        return this.group ? this.group.serialize() : undefined;
    }

    reset () {
        this.group.reset();
        this.$container.hide();
        this.triggerActive();
        if (this._applied) {
            this.list.reload({resetPage: true});
            this._applied = false;
        }
    }

    getEmptyCondition () {
        return this.group.getEmptyCondition();
    }

    addCondition () {
        return this.group.addCondition();
    }

    triggerActive () {
        const hasData = !!this.serialize();
        this.$container.toggleClass('active', hasData);
        this.events.trigger('toggleActive', hasData);
    }
};

// GROUP

Jam.ListFilter.Group = class Group {

    constructor (filter, columns) {
        this.filter = filter;
        this.columns = columns;
        this.events = new Jam.Events('ListFilter.Group');
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
        return new Jam.ListFilter.Condition(this);
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

    afterConditionRemove (condition) {
        Jam.ArrayHelper.removeValue(condition, this.conditions);
        if (!this.isEmpty()) {
            this.conditions[0].resetLogical();
        }
    }
};

// CONDITION

Jam.ListFilter.Condition = class Condition {

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
        this.events = new Jam.Events('ListFilter.Condition');
        this.logical = 'and';
        this.$container = this.filter.$conditionSample.clone().removeClass('hidden');
        this.$container.data('condition', this);
        if (!this.group.isEmpty()) {
            this.$container.addClass(this.logical);
        }
        this.$content = this.$container.children('.condition-content');
        this.$groupContainer = this.$container.children('.condition-group');
        this.$attrContainer = this.$content.find('.condition-attr-container');
        this.$attrSelect = this.$attrContainer.find('.condition-attr');
        this.$attrSelect.change(this.onChangeAttr.bind(this));
        this.$container.find('.remove-condition').click(this.remove.bind(this));
        this.$container.find('.condition-logical').click(this.toggleLogical.bind(this));
        this.$attrSelect.html(this.constructor.createAttrItems(this.group.columns)).select2();
    }

    getAttr () {
        return this.$attrSelect.val();
    }

    setAttr (name) {
        this.$attrSelect.val(name).change();
    }

    onChangeAttr () {
        this.removeType();
        const params = this.group.getAttrParams(this.getAttr());
        if (params) {
            this.type = this.createType(params);
            this.type.focus();
        }
    }

    createType (params) {
        let type = 'StringType';
        switch (params.type) {
            case 'boolean': type = 'BooleanType'; break;
            case 'date': type = 'DateType'; break;
            case 'id': type = 'IdType'; break;
            case 'selector': type = 'SelectorType'; break;
        }
        return new Jam.ListFilter[type](params, this);
    }

    getOperation () {
        return this.getOperationItem().val();
    }

    getOperationItem () {
        return this.$container.find('.condition-operation');
    }

    getValue () {
        return this.type ? this.type.getValue() : undefined;
    }

    getValueItem () {
        return this.$container.find('.condition-value');
    }

    toggleLogical () {
        this.$container.removeClass('and or');
        if (this.logical) {
            this.logical = this.logical === 'and' ? 'or' : 'and';
            this.$container.addClass(this.logical);
        }
    }

    resetLogical () {
        this.logical = undefined;
        this.toggleLogical();
    }

    removeType () {
        if (this.type) {
            this.type.remove();
            this.type = null;
        }
    }

    remove () {
        this.$container.remove();
        this.group.afterConditionRemove(this);
    }

    serialize () {
        const op = this.getOperation();
        const value = this.getValue();
        if (op && value !== undefined) {
            const and = this.logical !== 'or';
            const attr = this.getAttr();
            return this.type.getRequestData({and, attr, op, value});
        }
    }
};

// TYPE

Jam.ListFilter.Type = class Type {

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

    getValue () {
        return $.trim(this.getValueItem().val());
    }

    setValue (value) {
        return this.getValueItem().val(value);
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

    remove () {
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

// STRING

Jam.ListFilter.StringType = class StringType extends Jam.ListFilter.Type {

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
            this.filter.apply();
        }
    }
};

// BOOLEAN

Jam.ListFilter.BooleanType = class BooleanType extends Jam.ListFilter.Type {

    init () {
        super.init();
        this.getValueItem().change(this.changeValue.bind(this));
        this.changeValue();
    }

    changeValue () {
        this.setValue(this.getValueItem().is(':checked') ? 'true' : 'false');
    }
};

// DATE

Jam.ListFilter.DateType = class DateType extends Jam.ListFilter.Type {

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
        // reformat date to remove time on select day only
        date = date && moment(moment(date).format(format), format);
        this.setValue(date ? Jam.DateHelper.stringify(date, this.params.utc) : '');
        if (!date) {
            this.picker.hide();
        }
    }
};

// ID

Jam.ListFilter.IdType = class IdType extends Jam.ListFilter.StringType {

    init () {
        super.init();
        this.nested = new Jam.ListFilter.Nested(this);
    }

    getValue () {
        return this.nested.active() ? this.nested.getValue() : super.getValue();
    }

    remove () {
        super.remove();
        this.nested.remove();
    }
};

// SELECTOR

Jam.ListFilter.SelectorType = class SelectorType extends Jam.ListFilter.Type {

    init () {
        super.init();
        if (this.params.items) {
            this.createSimple();
        } else if (this.params.url) {
            this.createAjax();
        } else {
            this.removeEqualOptions();
        }
        this.nested = new Jam.ListFilter.Nested(this);
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

    removeEqualOptions () {
        const $select = this.condition.getOperationItem();
        $select.children().first().remove();
        $select.children().first().remove();
    }

    focus () {
        //super.focus();
        const $value = this.getValueItem();
        if ($value.data('select2')) {
            $value.select2('open');
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
            relation: this.params.relation
        }));
    }

    getValue () {
        return this.nested.active() ? this.nested.getValue() : super.getValue();
    }

    remove () {
        super.remove();
        this.nested.remove();
    }
};

// NESTED

Jam.ListFilter.Nested = class Nested {

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
            return this.condition.getOperationItem().children().last().remove(); // remove nested option
        }
        this.group = new Jam.ListFilter.Group(this.filter, columns);
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

    remove () {
        this.condition.$groupContainer.html('');
    }
};