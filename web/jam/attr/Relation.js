/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

Jam.RelationModelAttr = class RelationModelAttr extends Jam.ModelAttr {

    constructor () {
        super(...arguments);
        this.$grid = this.$attr.find('.data-grid');
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
        return this.list && this.list.params.depends;
    }

    getDependencyValue () {
        let data = this.list
            ? this.list.getObjectIds(this.list.findRows())
            : this.changes.getLinks();
        data = Jam.ArrayHelper.exclude(this.changes.getUnlinks(), data);
        data = Jam.ArrayHelper.exclude(this.changes.getDeletes(), data);
        return data.length ? data : null;
    }

    onDependencyChange () {
        this.list.clearLinks();
    }
};

Jam.AttrList = class AttrList extends Jam.List {

    init () {
        super.init();
        this.multiple = this.params.multiple;
        this.$container.mouseenter(this.showMouseEnter.bind(this));
        this.$container.mouseleave(this.hideMouseEnter.bind(this));
        this.grid.events.one('afterLoad', this.onAfterLoad.bind(this));
        this.grid.events.one('afterFail', this.afterInit);
    }

    clearLinks () {
        if (this.changes.hasLinks()) {
            this.changes.clearLinks();
            this.setValue();
            this.reload();
        }
    }

    createNotice () {
        return new Jam.Notice({container: $notice => this.$grid.prepend($notice)});
    }

    prepareRow (row, data, index) {
        if (this.changes.getLinks().includes(data[this.params.key])) {
            $(row).addClass('linked').attr('title', 'Add');
        }
        if (this.changes.getUnlinks().includes(data[this.params.key])) {
            $(row).addClass('unlinked').attr('title', 'Remove');
        }
        if (this.changes.getDeletes().includes(data[this.params.key])) {
            $(row).addClass('deleted').attr('title', 'Delete');
        }
        super.prepareRow(row, data, index);
    }

    beforeXhr (event, data) {
        super.beforeXhr(event, data);
        if (!this.changes.isEmpty()) {
            data.request.data.changes = this.changes.data;
        }
    }

    afterLoad () {
        super.afterLoad();
        this.attr.setBlank();
    }

    setValue () {
        if (this.attr.setValueByChanges()) {
            this.attr.triggerChange();
        }
    }

    getCommandMethod (name) {
        switch (name) {
            case 'link': return this.onLink;
            case 'unlink': return this.onUnlink;
        }
        return super.getCommandMethod(name);
    }

    getDependencyData () {
        const data = this.model.getDependencyData(this.attr);
        const result = {};
        for (const key of Object.keys(data)) {
            result[`d[${key}]`] = data[key];
        }
        return result;
    }

    beforeCommand () {
        super.beforeCommand();
        this.model.beforeCommand();
    }

    onAfterLoad () {
        this.attr.triggerChange();
        this.afterInit();
    }

    onAfterCloseModal (event, data) {
        if (data && data.result) {
            this.linkObjects(data.result);
            if (data.reopen) {
                this.loadModal(this.params.update, {id: data.result});
            }
        }
    }

    onCreate () {
        if (!this.revertChanges()) {
            this.loadModal(this.params.create, this.getDependencyData(), this.onAfterCloseModal.bind(this));
        }
    }

    onDelete () {
        const $rows = this.getSelectedRows();
        if ($rows) {
            const deferred = this.params.confirmDeletion ? Jam.dialog.confirmListDeletion() : $.when();
            deferred.then(() => this.deleteObjects($rows));
        }
    }

    onLink () {
        if (this.revertChanges()) {
            return null;
        }
        this.loadModal(this.params.link, this.getDependencyData(), (event, data) => {
            if (data && data.result) {
                this.linkObjects(data.result);
            }
        }, {multiple: this.multiple});
    }

    onUnlink () {
        const $rows = this.getSelectedRows();
        if ($rows) {
            this.unlinkObjects($rows);
        }
    }

    linkObjects (ids) {
        ids = typeof ids === 'string' ? ids.split(',') : [];
        this.multiple ? this.linkMultiple(ids) : this.linkSingle(ids);
        this.setValue();
        this.reload();
    }

    linkSingle (ids) {
        this.changes.linkSingle(ids, this.getObjectIds(this.findRows()));
    }

    linkMultiple (ids) {
        this.changes.linkMultiple(ids);
    }

    unlinkObjects ($rows) {
        this.changes.unlinkObjects(this.getObjectIds($rows));
        this.setValue();
        this.reload();
    }

    deleteObjects ($rows) {
        this.changes.deleteObjects(this.getObjectIds($rows));
        this.setValue();
        this.reload();
    }

    revertChanges () { // revert unlinks or deletes
        const ids = this.getObjectIds(this.findSelectedRows());
        if (this.multiple ? this.changes.revertMultiple(ids) : this.changes.revertSingle(ids)) {
            this.setValue();
            this.reload();
            return true;
        }
    }

    showMouseEnter () {
        this.$container.addClass('mouse-enter');
    }

    hideMouseEnter () {
        this.$container.removeClass('mouse-enter');
        this.notice.hide();
    }
};

Jam.AttrListChanges = class AttrListChanges {

    constructor () {
        this.data = {links: [], unlinks: [], deletes: []};
    }

    isEmpty () {
        return !this.data.links.length && !this.data.unlinks.length && !this.data.deletes.length;
    }

    setDefaultValue (value) {
        if (value) {
            this.data.links = value.split(',');
        }
    }

    hasLinks () {
        return this.data.links.length > 0;
    }

    getLinks () {
        return this.data.links;
    }

    clearLinks () {
        this.data.links = [];
    }

    getUnlinks () {
        return this.data.unlinks;
    }

    getDeletes () {
        return this.data.deletes;
    }

    serialize () {
        return this.isEmpty() ? '' : JSON.stringify(this.data);
    }

    linkSingle (ids, currents) {
        if (ids[0] === currents[0]) {
            return this.clear();
        }
        if (this.data.deletes.length) {
            this.data.unlinks = [];
            this.data.deletes = currents;
        } else {
            this.data.unlinks = currents;
            this.data.deletes = [];
        }
        this.data.links = ids;
    }

    linkMultiple (ids) {
        this.data.links = this.data.links.concat(Jam.ArrayHelper.exclude(this.data.links, ids));
        this.data.unlinks = Jam.ArrayHelper.exclude(ids, this.data.unlinks);
        this.data.deletes = Jam.ArrayHelper.exclude(ids, this.data.deletes);
    }

    unlinkObjects (ids) {
        this.data.links = Jam.ArrayHelper.exclude(ids, this.data.links);
        this.data.unlinks = this.data.unlinks.concat(Jam.ArrayHelper.exclude(this.data.unlinks, ids));
        this.data.deletes = Jam.ArrayHelper.exclude(ids, this.data.deletes);
    }

    deleteObjects (ids) {
        this.data.links = Jam.ArrayHelper.exclude(ids, this.data.links);
        this.data.unlinks = Jam.ArrayHelper.exclude(ids, this.data.unlinks);
        this.data.deletes = this.data.deletes.concat(Jam.ArrayHelper.exclude(this.data.deletes, ids));
    }

    revertMultiple (ids) {
        return this.revertItems('unlinks', ids) || this.revertItems('deletes', ids);
    }

    revertSingle (ids) {
        const reverted = this.revertItems('unlinks', ids) || this.revertItems('deletes', ids);
        if (reverted) {
            this.data.unlinks = this.data.links;
            this.data.links = [];
        }
        return reverted;
    }

    revertItems (key, ids) {
        let reverted = false;
        for (const id of ids) {
            const index = this.data[key].indexOf(id);
            if (index !== -1) {
                this.data[key].splice(index, 1);
                reverted = true;
            }
        }
        return reverted;
    }
};