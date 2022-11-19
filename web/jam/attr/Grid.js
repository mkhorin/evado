/**
 * @copyright Copyright (c) 2022 Maxim Khorin <maksimovichu@gmail.com>
 */
Jam.GridModelAttr = class GridModelAttr extends Jam.ModelAttr {

    constructor () {
        super(...arguments);
        this.$grid = this.find('.data-grid');
        this.gridParams = this.$grid.data('params');
        this.changes = new Jam.RelationChanges(this);
    }

    activate () {
        if (this.canActivate()) {
            this.activated = true;
            Jam.deferred.add(this.createList.bind(this));
            this.bindDependencyChange();
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

    getDependencyNames () {
        const names = this.list?.params.depends;
        return Array.isArray(names) ? names : names ? [names] : [];
    }
};