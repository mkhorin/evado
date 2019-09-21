/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

Jam.ModelAttraction = class {

    constructor (model) {
        this.model = model;
        this.elements = [];
        this.events = new Jam.Events('ModelAttraction');
        this.init();
    }

    init () {
        for (const item of this.model.$form.find('[data-attraction]')) {
            const $item = $(item);
            const data = $item.data('attraction');
            if (data) {
                this.elements.push(new Jam.ModelAttractionElement($item, data, this));
            }
        }
        this.model.events.on('change', this.update.bind(this));
        this.update();
    }

    update (event, target) {
        for (const element of this.elements) {
            element.update();
        }
        this.events.trigger('update');
    }
};

Jam.ModelAttractionElement = class {

    constructor ($item, data, attraction) {
        this.attraction = attraction;
        this.$item = $item;
        this.attr = Jam.ModelAttr.get($item);
        this.data = data || {};
        this.actions = {};
        this.init();
    }

    init () {
        for (const id of Object.keys(this.data)) {
            const action = this.create(id, this.data[id]);
            if (action) {
                this.actions[id] = action;
            } else {
                console.error(`Invalid attraction action: ${id}`);
            }
        }
    }

    create (id, data) {
        switch (id) {
            case 'visible': return new Jam.ModelAttractionVisible(this, data);
            case 'enabled': return new Jam.ModelAttractionEnabled(this, data);
            case 'required': return new Jam.ModelAttractionRequired(this, data);
            case 'value': return new Jam.ModelAttractionValue(this, data);
        }
    }

    update () {
        for (const id of Object.keys(this.actions)) {
            this.actions[id].update();
        }
    }
};

Jam.ModelAttractionAction = class {

    constructor (element, data) {
        this.element = element;
        this.data = data;
        this.init();
    }

    init () {
        this.condition = new Jam.ModelCondition(this.data, this.element.attraction.model);
    }

    isValid () {
        return this.condition.isValid();
    }

    update () {
        this.isValid() ? this.setValid() : this.setInvalid();
    }
};

Jam.ModelAttractionVisible = class extends Jam.ModelAttractionAction {

    update () {
        const group = this.element.$item.data('group');
        const visible = this.isValid();
        group ? group.toggle(visible)
              : this.element.$item.toggleClass('hidden', !visible);
    }
};

Jam.ModelAttractionEnabled = class extends Jam.ModelAttractionAction {

    update () {
        if (this.element.attr) {
            this.element.attr.enable(this.isValid());
        } else {
            this.element.$item.toggleClass('disabled', !this.isValid());
        }
    }
};

Jam.ModelAttractionRequired = class extends Jam.ModelAttractionAction {

    update () {
        //this.element.$item.toggleClass('hidden', !this.isValid());
    }
};

Jam.ModelAttractionValue = class extends Jam.ModelAttractionAction {

    init () {
        if (!this.element.attr) {
            return console.error('Attraction: Value action without model attribute');
        }
        this.value = this.element.attr.normalizeValue(this.data[0]);
        this.condition = new Jam.ModelCondition(this.data[1], this.element.attraction.model);
    }

    getValue () {
        return Array.isArray(this.value)
            ? this.element.attraction.model.getAttr(this.value[0]).getValue()
            : this.value;
    }

    update () {
        if (this.element.attr && this.isValid()) {
            this.element.attr.setValue(this.getValue());
        }
    }
};