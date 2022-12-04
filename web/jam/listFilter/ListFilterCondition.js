/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
Jam.ListFilterCondition = class ListFilterCondition {

    static createAttrItems (columns) {
        let result = '<option></option>';
        for (let {name, label, translate} of columns) {
            if (label === undefined) {
                label = name;
            } else if (translate !== false) {
                label = Jam.t(label, translate);
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
        this.setLogical(false);
        this.$content = this.$container.children('.condition-content');
        this.$groupContainer = this.$container.children('.condition-group');
        this.$attrContainer = this.$content.find('.condition-attr-container');
        this.$attrSelect = this.$attrContainer.find('.condition-attr');
        this.$attrSelect.change(this.onChangeAttr.bind(this));
        this.$container.find('.delete-condition').click(this.onDelete.bind(this));
        this.$container.find('.condition-logical').click(this.onToggleLogical.bind(this));
        const items = this.constructor.createAttrItems(this.group.columns);
        this.$attrSelect.html(items).select2();
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
        const defaultType = 'string';
        const type = params.type || defaultType;
        const name = `ListFilterType${Jam.StringHelper.capitalize(type)}`;
        if (Jam[name]) {
            return new Jam[name](params, this);
        }
        params.type = defaultType;
        return new Jam.ListFilterTypeString(params, this);
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

    getValueElement () {
        return this.$container.children('.condition-content').find('.condition-value');
    }

    onToggleLogical () {
        this.setLogical(!this.or);
    }

    setLogical (or) {
        this.or = or;
        this.$container.removeClass('and or');
        this.$container.addClass(this.or ? 'or' : 'and');
    }

    deleteType () {
        this.type?.delete();
        this.type = null;
    }

    onDelete () {
        this.$container.remove();
        this.group.afterDeleteCondition(this);
    }

    serialize () {
        const op = this.getOperation();
        const value = this.getValue();
        if (op && value !== undefined) {
            const or = this.or ? true : undefined;
            const attr = this.getAttr();
            return this.type.serialize({or, attr, op, value});
        }
    }

    parse (data) {
        this.setLogical(data.or);
        this.$attrSelect.val(data.attr).change();
        this.setOperation(data.op);
        this.type?.changeValue(data.value, data);
    }

    removeOperation (value) {
        return this.getOperationItem().children(`[value="${value}"]`).remove();
    }
};