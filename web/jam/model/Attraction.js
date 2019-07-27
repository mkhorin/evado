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
        for (let item of this.model.$form.find('[data-attraction]')) {
            let $item = $(item);
            let data = $item.data('attraction');
            if (data) {
                this.elements.push(new Jam.ModelAttraction.Element($item, data, this));
            }
        }
        this.model.events.on('change', this.update.bind(this));
        this.update();
    }

    update (event) {
        for (let element of this.elements) {
            element.update();
        }
        this.events.trigger('update');
    }
};

Jam.ModelAttraction.Element = class {

    constructor ($item, data, attraction) {
        this.attraction = attraction;
        this.$item = $item;
        this.attr = Jam.ModelAttr.get($item);
        this.data = data || {};
        this.actions = {};
        this.init();
    }

    init () {
        for (let id of Object.keys(this.data)) {
            let action = this.create(id, this.data[id]);
            if (action) {
                this.actions[id] = action;
            } else {
                console.error(`Invalid attraction action: ${id}`);
            }
        }
    }

    create (id, data) {
        switch (id) {
            case 'visible': return new Jam.ModelAttraction.Visible(this, data);
            case 'enabled': return new Jam.ModelAttraction.Enabled(this, data);
            case 'required': return new Jam.ModelAttraction.Required(this, data);
            case 'valued': return new Jam.ModelAttraction.Valued(this, data);
        }
    }

    update () {
        for (let id of Object.keys(this.actions)) {
            this.actions[id].update();
        }
    }
};

Jam.ModelAttraction.Action = class {

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

Jam.ModelAttraction.Visible = class extends Jam.ModelAttraction.Action {

    update () {
        let group = this.element.$item.data('group');
        let visible = this.isValid();
        group ? group.toggle(visible)
              : this.element.$item.toggleClass('hidden', !visible);
    }
};

Jam.ModelAttraction.Enabled = class extends Jam.ModelAttraction.Action {

    update () {
        if (this.element.attr) {
            this.element.attr.enable(this.isValid());
        } else {
            this.element.$item.toggleClass('disabled', !this.isValid());
        }
    }
};

Jam.ModelAttraction.Required = class extends Jam.ModelAttraction.Action {

    update () {
        //this.element.$item.toggleClass('hidden', !this.isValid());
    }
};

Jam.ModelAttraction.Valued = class extends Jam.ModelAttraction.Action {

    init () {
        if (!this.element.attr) {
            return console.error('Attraction: Valued action without model attribute');
        }
        this.value = this.element.attr.normalizeValue(this.data[0]);
        this.condition = new Jam.ModelCondition(this.data[1], this.element.attraction.model);
    }

    getValue () {
        return Array.isArray(this.value)
            ? this.element.attraction.model.getValueFieldByName(this.value[0]).val()
            : this.value;
    }

    update () {
        if (this.element.attr && this.isValid()) {
            this.element.attr.setValue(this.getValue());
        }
    }
};