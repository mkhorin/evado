/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

Jam.ModelAttrRelation = class ModelAttrRelation extends Jam.ModelAttr {

    activate () {
        if (!this.canActivate()) {
            return false;
        }
        this.activated = true;
        Jam.deferred.add(this.createList.bind(this));
    }

    createList (afterInit) {
        (new Jam.AttrList(this.$attr.find('.data-grid'), {attr: this, afterInit})).init();
    }
};

Jam.AttrList = class AttrList extends Jam.List {

    init () {
        this.model = this.attr.model;
        this.changes = new Jam.AttrListChanges(this);

        super.init();

        this.$container.mouseenter(this.showMouseEnter.bind(this));
        this.$container.mouseleave(this.hideMouseEnter.bind(this));
        this.grid.events.one('afterLoad', this.afterInit);
        this.grid.events.one('afterFail', this.afterInit);
    }

    createNotice () {
        return new Jam.Notice({container: $notice => this.$grid.prepend($notice)});
    }

    prepareRow (row, data, index) {
        if (this.changes.getLinks().includes(data[this.params.key])) {
            $(row).addClass('inserted').attr('title', 'Inserted');
        }
        if (this.changes.getUnlinks().includes(data[this.params.key])) {
            $(row).addClass('unlinked').attr('title', 'Unlink');
        }
        if (this.changes.getRemoves().includes(data[this.params.key])) {
            $(row).addClass('removed').attr('title', 'Remove');
        }
        super.prepareRow(row, data, index);
    }

    beforeXhr (event, data) {
        super.beforeXhr(event, data);
        if (!this.changes.isEmpty()) {
            data.request.data.changes = this.changes.data;
        }
    }

    serializeValue () {
        const value = this.changes.isEmpty() ? '' : JSON.stringify(this.changes.data);
        this.attr.$value.val(value).change();
    }

    getControlMethod (id) {
        switch (id) {
            case 'link': return this.onLink;
            case 'unlink': return this.onUnlink;
        }
        return super.getControlMethod(id);
    }

    beforeControl () {
        super.beforeControl();
        this.model.beforeControl();
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
            this.loadModal(this.params.create, null, this.onAfterCloseModal.bind(this));
        }
    }

    onRemove () {
        const $rows = this.getSelectedRows();
        if ($rows) {
            Jam.dialog.confirmRemove('Delete selected items?').then(()=> this.removeObjects($rows));
        }
    }

    onLink () {
        if (!this.revertChanges()) {
            this.loadModal(this.params.link, null, (event, data)=> {
                if (data && data.result) {
                    this.linkObjects(data.result);
                }
            }, {multiple: this.params.multiple});
        }
    }

    onUnlink () {
        const $rows = this.getSelectedRows();
        if ($rows) {
            this.unlinkObjects($rows);
        }
    }

    linkObjects (ids) {
        ids = typeof ids === 'string' ? ids.split(',') : [];
        this.params.multiple
            ? this.linkMultiple(ids)
            : this.linkSingle(ids);
        this.serializeValue();
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
        this.serializeValue();
        this.reload();
    }

    removeObjects ($rows) {
        this.changes.removeObjects(this.getObjectIds($rows));
        this.serializeValue();
        this.reload();
    }

    revertChanges () {
        if (!this.changes.revert(this.getObjectIds(this.findSelectedRows()))) {
            return false;
        }
        this.serializeValue();
        this.reload();
        return true;
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

    constructor (list) {
        this.data = {};
        this.list = list;
        this.clear();
        Object.assign(this.data, Jam.Helper.parseJson(list.attr.getValue()));
    }

    clear () {
        this.data.links = [];
        this.data.unlinks = [];
        this.data.removes = [];
    }

    isEmpty () {
        return !this.data.links.length && !this.data.unlinks.length && !this.data.removes.length;
    }

    getLinks () {
        return this.data.links;
    }

    getUnlinks () {
        return this.data.unlinks;
    }

    getRemoves () {
        return this.data.removes;
    }

    linkSingle (ids, old) {
        if (old[0] === ids[0]) {
            return this.clear();
        }
        this.data.links = ids;
        if (this.data.removes.length) {
            this.data.unlinks = [];
            this.data.removes = old;
        } else {
            this.data.unlinks = old;
            this.data.removes = [];
        }
    }

    linkMultiple (ids) {
        this.data.links = this.data.links.concat(Jam.ArrayHelper.diff(ids, this.data.links));
        this.data.unlinks = Jam.ArrayHelper.diff(this.data.unlinks, ids);
        this.data.removes = Jam.ArrayHelper.diff(this.data.removes, ids);
    }

    unlinkObjects (ids) {
        this.data.links = Jam.ArrayHelper.diff(this.data.links, ids);
        this.data.unlinks = this.data.unlinks.concat(Jam.ArrayHelper.diff(ids, this.data.unlinks));
        this.data.removes = Jam.ArrayHelper.diff(this.data.removes, ids);
    }

    removeObjects (ids) {
        this.data.links = Jam.ArrayHelper.diff(this.data.links, ids);
        this.data.unlinks = Jam.ArrayHelper.diff(this.data.unlinks, ids);
        this.data.removes = this.data.removes.concat(Jam.ArrayHelper.diff(ids, this.data.removes));
    }

    revert (ids) {
        return ids.length && (this.revertList(this.data.unlinks, ids) || this.revertList(this.data.removes, ids));
    }

    revertList (list, ids) {
        let reverted = false;
        for (const id of ids) {
            const index = list.indexOf(id);
            if (index !== -1) {
                list.splice(index, 1);
                reverted = true;
            }
        }
        return reverted;
    }
};