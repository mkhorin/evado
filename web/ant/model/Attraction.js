'use strict';

Ant.ModelAttraction = class {

    constructor (model) {
        this.model = model;
        this.elements = [];
        this.event = new Ant.Event(this.constructor.name);
        this.init();
    }

    init () {
        this.model.$form.find('[data-attraction]').each((index, element)=> {
            let $item = $(element);
            let data = $item.data('attraction');
            if (data) {
                this.elements.push(new Ant.ModelAttraction.Element($item, data, this));
            }
        });
        this.model.event.on('change', this.update.bind(this));
        this.update();
    }

    update (event) {
        for (let element of this.elements) {
            element.update();
        }
        this.event.trigger('update');
    }
};

Ant.ModelAttraction.Element = class {

    constructor ($item, data, attraction) {
        this.attraction = attraction;
        this.$item = $item;
        this.attr = Ant.ModelAttr.get($item);
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
            case 'visible': return new Ant.ModelAttraction.Visible(this, data);
            case 'enabled': return new Ant.ModelAttraction.Enabled(this, data);
            case 'required': return new Ant.ModelAttraction.Required(this, data);
            case 'valued': return new Ant.ModelAttraction.Valued(this, data);
        }
    }

    update () {
        for (let id of Object.keys(this.actions)) {
            this.actions[id].update();
        }
    }
};

Ant.ModelAttraction.Action = class {

    constructor (element, data) {
        this.element = element;
        this.data = data;
        this.init();
    }

    init () {
        this.condition = new Ant.ModelCondition(this.data, this.element.attraction.model);
    }

    isValid () {
        return this.condition.isValid();
    }

    update () {
        this.isValid() ? this.setValid() : this.setInvalid();
    }
};

Ant.ModelAttraction.Visible = class extends Ant.ModelAttraction.Action {

    update () {
        let group = this.element.$item.data('group');
        let visible = this.isValid();
        group ? group.toggle(visible)
              : this.element.$item.toggleClass('hidden', !visible);
    }
};

Ant.ModelAttraction.Enabled = class extends Ant.ModelAttraction.Action {

    update () {
        if (this.element.attr) {
            this.element.attr.enable(this.isValid());
        } else {
            this.element.$item.toggleClass('disabled', !this.isValid());
        }
    }
};

Ant.ModelAttraction.Required = class extends Ant.ModelAttraction.Action {

    update () {
        //this.element.$item.toggleClass('hidden', !this.isValid());
    }
};

Ant.ModelAttraction.Valued = class extends Ant.ModelAttraction.Action {

    init () {
        if (!this.element.attr) {
            return console.error('Attraction: Valued action without model attr');
        }
        this.value = this.element.attr.normalizeValue(this.data[0]);
        this.condition = new Ant.ModelCondition(this.data[1], this.element.attraction.model);
    }

    getValue () {
        return this.value instanceof Array
            ? this.element.attraction.model.getValueFieldByName(this.value[0]).val()
            : this.value;
    }

    update () {
        if (this.element.attr && this.isValid()) {
            this.element.attr.setValue(this.getValue());
        }
    }
};