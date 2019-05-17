'use strict';

Ant.ModelAttr.Relation = class extends Ant.ModelAttr {

    activate () {
        if (!this.canActivate()) {
            return false;
        }
        this.activated = true;
        Ant.scheduler.add(new Ant.Task(this.createList.bind(this)));
    }

    createList (callback) {
        return new Ant.AttrList(this.$attr.find('.data-grid'), {
            attr: this,
            afterInit: callback
        });
    }
};

Ant.AttrList = class extends Ant.List {

    init () {
        this.model = this.attr.model;
        this.changes = new Ant.AttrListChanges(this);

        super.init();

        this.$container.mouseenter(this.showMouseEnter.bind(this));
        this.$container.mouseleave(this.hideMouseEnter.bind(this));
        this.grid.event.one('afterLoad', this.afterInit);
        this.grid.event.one('afterFail', this.afterInit);
    }

    createNotice () {
        return new Ant.Notice({container: $notice => this.$grid.prepend($notice)});
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
            data.params.changes = this.changes.data;
        }
    }

    serializeValue () {
        let value = this.changes.isEmpty() ? '' : JSON.stringify(this.changes.data);
        this.attr.$value.val(value).change();
    }

    create (event, params) {
        if (!this.revertChanges()) {
            this.loadModal(this.params.create, null, this.onAfterCloseModal.bind(this));
        }
    }

    onAfterCloseModal (event, data) {
        if (data && data.result) {
            this.linkObjects(data.result);
            if (data.reopen) {
                this.loadModal(this.params.update, {id: data.result});
            }
        }
    }

    onClickControl (event) {
        if (super.onClickControl(event) === false) {
            switch (event.currentTarget.dataset.id) {
                case 'link': return this.link();
                case 'unlink': return this.unlink();
            }
            return false;
        }
    }

    link () {
        if (!this.revertChanges()) {
            this.loadModal(this.params.link, null, (event, data)=> {
                data && data.result && this.linkObjects(data.result);
            },{multiple: this.params.multiple});
        }
    }

    unlink () {
        let $rows = this.getSelectedRows();
        if ($rows && Ant.Helper.confirm('Unlink selected items?')) {
            this.unlinkObjects($rows);
        }
    }

    linkObjects (ids) {
        ids = typeof ids === 'string'  ? ids.split(',') : [];
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

Ant.AttrListChanges = class {

    constructor (list) {
        this.data = {};
        this.list = list;
        this.clear();
        Object.assign(this.data, Ant.Helper.parseJson(list.attr.getValue()));
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

    linkSingle (ids, olds) {
        if (olds[0] === ids[0]) {
            return this.clear();
        }
        this.data.links = ids;
        if (this.data.removes.length) {
            this.data.unlinks = [];
            this.data.removes = olds;
        } else {
            this.data.unlinks = olds;
            this.data.removes = [];
        }
    }

    linkMultiple (ids) {
        this.data.links = this.data.links.concat(Ant.ArrayHelper.diff(ids, this.data.links));
        this.data.unlinks = Ant.ArrayHelper.diff(this.data.unlinks, ids);
        this.data.removes = Ant.ArrayHelper.diff(this.data.removes, ids);
    }

    unlinkObjects (ids) {
        this.data.links = Ant.ArrayHelper.diff(this.data.links, ids);
        this.data.unlinks = this.data.unlinks.concat(Ant.ArrayHelper.diff(ids, this.data.unlinks));
        this.data.removes = Ant.ArrayHelper.diff(this.data.removes, ids);
    }

    removeObjects (ids) {
        this.data.links = Ant.ArrayHelper.diff(this.data.links, ids);
        this.data.unlinks = Ant.ArrayHelper.diff(this.data.unlinks, ids);
        this.data.removes = this.data.removes.concat(Ant.ArrayHelper.diff(ids, this.data.removes));
    }

    revert (ids) {
        return ids.length && (this.revertList(this.data.unlinks, ids) || this.revertList(this.data.removes, ids));
    }

    revertList (list, ids) {
        let reverted = false;
        for (let id of ids) {
            let index = list.indexOf(id);
            if (index !== -1) {
                list.splice(index, 1);
                reverted = true;
            }
        }
        return reverted;
    }
};