'use strict';

Ant.ModelAttr.Selection = class extends Ant.ModelAttr {

    init () {
        super.init();
        this.sets = Ant.ModelAttr.Selection.Set.createSets(this.$attr.data('sets'), this);
        this.select2 = this.$attr.data('select2');
        this.$select = this.$attr.find('select');
        this.$select.change(this.changeValue.bind(this));
        this.model.event.on('change', this.update.bind(this));
        setTimeout(this.update.bind(this), 0);
    }

    activate () {
        if (this.canActivate()) {
            if (this.select2) {
                this.$select.select2(this.select2);
            }
            this.activated = true;
        }
    }

    setValue (value) {
        this.$value.val(value);
        this.$select.val(value);
    }

    changeValue () {
        if (this.$value.val() !== this.$select.val()) {
            this.$value.val(this.$select.val()).change();
        }
    }

    update () {
        if (this.updateItems()) {
            let value = this.getValue();
            this.$select.html(this.build());
            this.$select.val(value);
            if (value !== this.$select.val()) {
                this.$value.val('').change();
            }
        }
    }

    updateItems () {
        let items = Ant.ModelAttr.Selection.Set.filterItems(this.sets);
        this.items = Ant.ArrayHelper.equals(items, this.items) ? this.items : items;
        return this.items === items;
    }

    build () {
        let content = '<option value></option>';
        for (let item of this.items) {
            content += `<option value="${item.value}">${item.text}</option>`;
        }
        return content;
    }
};

Ant.ModelAttr.RadioSelection = class extends Ant.ModelAttr {

    init () {
        super.init();
        this.sets = Ant.ModelAttr.Selection.Set.createSets(this.$attr.data('sets'), this);
        this.$list = this.$attr.find('.radio-items');
        this.$list.on('change', '[type="radio"]', this.changeValue.bind(this));
        this.model.event.on('change', this.update.bind(this));
        setTimeout(this.update.bind(this), 0);
    }

    getRadioItems () {
        return this.$list.find('[type="radio"]');
    }

    getRadioItem (value) {
        return this.getRadioItems().filter(`[value="${value}"]`);
    }

    enable (state) {
        this.$value.attr('disabled', !state);
        this.getRadioItems().attr('disabled', !state);
    }

    setValue (value) {
        this.$value.val(value);
        this.getRadioItems().prop('checked', false);
        this.getRadioItem(value).prop('checked', true);
    }

    changeValue (event) {
        if (event.target.checked) {
            this.getRadioItems().not(event.target).prop('checked', false);
            this.$value.val($(event.target).val()).change();
        }
    }

    update () {
        if (this.updateItems()) {
            let value = this.getValue();
            this.$list.html(this.build());
            this.getRadioItem(value).length
                ? this.setValue(value)
                : this.$value.val('').change();
        }
    }

    updateItems () {
        let items = Ant.ModelAttr.Selection.Set.filterItems(this.sets);
        this.items = Ant.ArrayHelper.equals(items, this.items) ? this.items : items;
        return this.items === items;
    }

    build () {
        return this.items.map(item => {
            return `<label class="radio radio-inline"><input type="radio" value="${item.value}">${item.text}</label>`;
        }).join('');
    }
};

Ant.ModelAttr.Selection.Set = class {

    static createSets (data, selection) {
        let sets = [];
        if (Array.isArray(data)) {
            for (let item of data) {
                sets.push(new this(item, selection));
            }
        }
        return sets;
    }

    static filterItems (sets) {
        let items = [];
        for (let set of sets) {
            if (set.isActive()) {
                items = items.concat(set.items);
            }
        }
        return Ant.ArrayHelper.uniqueByKey('value', items);
    }

    constructor (data, owner) {
        this.owner = owner;
        this.items = data.items;
        this.condition = data.condition;
        this.init();
    }

    init () {
        if (this.condition) {
            this.condition = new Ant.ModelCondition(this.condition, this.owner.model);
        }
    }

    isActive () {
        return !this.condition || this.condition.isValid();
    }
};