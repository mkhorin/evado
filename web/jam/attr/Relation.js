/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
Jam.RelationModelAttr = class RelationModelAttr extends Jam.ModelAttr {

    constructor () {
        super(...arguments);
        this.$grid = this.find('.data-grid');
        this.gridParams = this.$grid.data('params');
        this.initChanges();
    }

    initChanges () {
        this.changes = new Jam.AttrListChanges(this);
        this.changes.setDefaultValue(this.getValue());
        this.setValueByChanges();
    }

    hasValue () {
        const max = this.list ? this.list.grid.itemMaxSize : 0;
        const removes = this.changes.getUnlinks().length + this.changes.getDeletes().length;
        return this.changes.hasLinks() || max > removes;
    }

    getLinkedValue () {
        const links = this.changes.getLinks();
        return this.gridParams.multiple ? links : links[0];
    }

    setValueByChanges () {
        const value = this.changes.serialize();
        if (this.getValue() !== value) {
            this.setValue(value);
            return true;
        }
    }

    activate () {
        if (!this.canActivate()) {
            return false;
        }
        this.activated = true;
        Jam.deferred.add(this.createList.bind(this));
        this.bindDependencyChange();
    }

    createList (afterInit) {
        this.list = (new Jam.AttrList(this.$grid, {
            attr: this,
            changes: this.changes,
            model: this.model,
            afterInit
        }));
        this.list.init();
    }

    getDependencyNames () {
        return this.list?.params.depends;
    }

    getDependencyValue () {
        let data = this.list
            ? this.list.getObjectIds(this.list.findItems())
            : this.changes.getLinks();
        data = Jam.ArrayHelper.exclude(this.changes.getUnlinks(), data);
        data = Jam.ArrayHelper.exclude(this.changes.getDeletes(), data);
        return data.length ? data : null;
    }

    onDependencyChange () {
        this.list.clearLinks();
    }
};