/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
Jam.AttrList = class AttrList extends Jam.List {

    init () {
        super.init();
        if (this.params.loadOnDemand) {
            this.afterInit();
        } else {
            this.grid.events.one('afterLoad', this.onAfterLoad.bind(this));
            this.grid.events.one('afterFail', this.afterInit);
        }
    }

    activate () {
        super.activate();
        this.$grid.mouseenter(this.showCommands.bind(this));
        this.$grid.mouseleave(this.hideCommands.bind(this));
    }

    addFrameCommands () {
        // clear parent implementation
    }

    clearLinks () {
        if (this.changes.hasLinks()) {
            this.changes.clearLinks();
            this.setValue();
            this.reload();
        }
    }

    createAlert () {
        return new Jam.Alert({
            container: $alert => this.$grid.prepend($alert)
        });
    }

    prepareItem (item, data, index) {
        const id = data[this.params.key];
        if (this.changes.hasLink(id)) {
            $(item).addClass('linked').attr('title', 'Add');
        }
        if (this.changes.hasUnlink(id)) {
            $(item).addClass('unlinked').attr('title', 'Remove');
        }
        if (this.changes.hasDelete(id)) {
            $(item).addClass('deleted').attr('title', 'Delete');
        }
        super.prepareItem(item, data, index);
    }

    beforeXhr (event, data) {
        super.beforeXhr(event, data);
        if (!this.changes.isEmpty()) {
            data.request.data.changes = this.changes.getData();
        }
    }

    afterLoad () {
        super.afterLoad();
        this.attr.toggleBlank();
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

    getLinkUrl () {
        return this.getParamUrl(this.params.link, this.params.linkParams);
    }

    beforeCommand () {
        return super.beforeCommand() && this.model.beforeCommand();
    }

    onAfterLoad () {
        this.attr.triggerChange();
        this.afterInit();
    }

    onCreate () {
        if (!this.revertChanges()) {
            const url = this.getCreateUrl();
            const data = this.getDependencyData();
            this.openFrame(url, data, this.onAfterCloseFrame);
        }
    }

    onAfterCloseFrame (event, data) {
        if (!data) {
            return false;
        }
        if (data.reload) {
            return this.addAfterCloseListener();
        }
        const id = data.result;
        if (!id) {
            return false;
        }
        this.linkObjects(id);
        if (data.reopen) {
            this.openFrame(this.getUpdateUrl(), {id});
        }
    }

    onDelete () {
        const $items = this.getSelectedItems();
        if ($items) {
            const deferred = this.params.confirmDeletion
                ? Jam.dialog.confirmListDeletion()
                : null;
            $.when(deferred).then(() => this.deleteObjects($items));
        }
    }

    onLink () {
        if (!this.revertChanges()) {
            const url = this.getLinkUrl();
            const data = this.getDependencyData();
            this.openFrame(url, data, this.onAfterCloseLinkModal, {
                multiple: this.multiple
            });
        }
    }

    onAfterCloseLinkModal (event, data) {
        if (data?.result) {
            this.linkObjects(data.result);
        }
    }

    onUnlink () {
        const $items = this.getSelectedItems();
        if ($items) {
            this.unlinkObjects($items);
        }
    }

    linkObjects (ids) {
        ids = typeof ids === 'string' ? ids.split(',') : [];
        this.multiple
            ? this.linkMultiple(ids)
            : this.linkSingle(ids);
        this.setValue();
        this.reload();
    }

    linkSingle (ids) {
        const currents = this.getObjectIds(this.findItems());
        this.changes.linkSingle(ids, currents, this.params);
    }

    linkMultiple (ids) {
        this.changes.linkMultiple(ids);
    }

    unlinkObjects ($items) {
        const ids = this.getObjectIds($items);
        this.changes.unlinkObjects(ids);
        this.setValue();
        this.redraw();
    }

    deleteObjects ($items) {
        const ids = this.getObjectIds($items);
        this.changes.deleteObjects(ids);
        this.setValue();
        this.redraw();
    }

    /**
     * Revert unlinks or deletes
     */
    revertChanges () {
        const ids = this.getObjectIds(this.findSelectedItems());
        const result = this.multiple
            ? this.changes.revertMultiple(ids)
            : this.changes.revertSingle(ids);
        if (result) {
            this.setValue();
            this.reload();
            return true;
        }
    }

    showCommands () {
        this.addClass('show-commands');
    }

    hideCommands () {
        this.removeClass('show-commands');
        this.alert.hide();
    }
};