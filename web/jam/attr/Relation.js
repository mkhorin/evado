/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
Jam.RelationModelAttr = class RelationModelAttr extends Jam.ModelAttr {

    constructor () {
        super(...arguments);
        this.$grid = this.find('.data-grid');
        this.gridParams = this.$grid.data('params');
        this.createChanges();
    }

    createChanges () {
        this.changes = new Jam.RelationChanges(this);
        this.changes.setDefaultValue(this.getValue());
        this.setValueByChanges();
    }

    hasValue () {
        if (this.changes.hasLinks()) {
            return true;
        }
        const max = this.list?.grid.itemMaxSize || 0;
        const removes = this.changes.countRemoves();
        return max > removes;
    }

    getLinkedValue () {
        return this.gridParams.multiple
            ? this.changes.links
            : this.changes.links[0];
    }

    setValueByChanges () {
        const value = this.changes.serialize();
        if (this.getValue() !== value) {
            this.setValue(value);
            return true;
        }
    }

    activate () {
        if (this.canActivate()) {
            this.activated = true;
            Jam.deferred.add(this.createList.bind(this));
            this.addDependencyListeners();
        }
    }

    createList (afterInit) {
        this.list = new Jam.AttrList(this.$grid, {
            attr: this,
            changes: this.changes,
            model: this.model,
            afterInit
        });
        this.list.init();
    }

    getActualValue () {
        let items = this.list
            ? this.list.getObjectIds(this.list.findItems())
            : this.changes.links;
        items = this.changes.excludeUnlinks(items);
        items = this.changes.excludeDeletes(items);
        return items.length ? items : null;
    }

    getDependencyNames () {
        const names = this.list?.params.depends;
        return Array.isArray(names) ? names : names ? [names] : [];
    }

    onDependencyChange () {
        this.list.clearLinks();
    }
};