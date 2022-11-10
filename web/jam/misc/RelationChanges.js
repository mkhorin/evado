/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
Jam.RelationChanges = class RelationChanges {

    constructor (attr) {
        this.attr = attr;
        this.initialValues = [];
        this.clear();
    }

    isEmpty () {
        return !this.links.length
            && !this.unlinks.length
            && !this.deletes.length;
    }

    hasLinks () {
        return this.links.length > 0;
    }

    hasUnlinks () {
        return this.unlinks.length > 0;
    }

    hasInitialValues () {
        return this.initialValues.length > 0;
    }

    hasDeletes () {
        return this.deletes.length > 0;
    }

    hasLink (id) {
        return this.links.includes(id);
    }

    hasUnlink (id) {
        return this.unlinks.includes(id);
    }

    hasDelete (id) {
        return this.deletes.includes(id);
    }

    hasInitialValue (id) {
        return this.initialValues.includes(id);
    }

    getData () {
        const {links, unlinks, deletes} = this;
        return {links, unlinks, deletes};
    }

    getValues () {
        return this.hasInitialValues() ? this.initialValues : this.links;
    }

    addLink (id) {
        this.links.push(id);
    }

    addUnlink (id) {
        this.unlinks.push(id);
    }

    addDelete (id) {
        this.deletes.push(id);
    }

    excludeUnlinks (sources) {
        return Jam.ArrayHelper.exclude(this.unlinks, sources);
    }

    excludeDeletes (sources) {
        return Jam.ArrayHelper.exclude(this.deletes, sources);
    }

    removeLink (id) {
        return Jam.ArrayHelper.remove(id, this.links);
    }

    removeUnlink (id) {
        return Jam.ArrayHelper.remove(id, this.unlinks);
    }

    removeDelete (id) {
        return Jam.ArrayHelper.remove(id, this.deletes);
    }

    clearLinks () {
        this.links = [];
    }

    clearUnlinks () {
        this.unlinks = [];
    }

    clearDeletes () {
        this.deletes = [];
    }

    clear () {
        this.clearLinks();
        this.clearUnlinks();
        this.clearDeletes();
    }

    countRemoves () {
        return this.unlinks.length + this.deletes.length;
    }

    setDefaultValue (value) {
        if (value) {
            this.links = value.split(',');
        }
    }

    setInitialValue (data) {
        if (data) {
            this.initialValues = Array.isArray(data) ? data : [data];
        }
    }

    serialize () {
        return this.isEmpty() ? '' : JSON.stringify(this.getData());
    }

    linkValue (value) {
        if (!this.hasInitialValue(value)) {
            this.addLink(value);
        }
        this.removeUnlink(value);
        this.removeDelete(value);
    }

    unlinkValue (value) {
        this.removeLink(value);
        this.addUnlink(value);
        this.removeDelete(value);
    }

    unlinkCurrentValue (value) {
        if (this.hasInitialValues() && !this.hasInitialValue(value)) {
            const initial = this.initialValues[0];
            if (!this.hasDelete(initial)) {
                this.clearUnlinks();
                this.addUnlink(initial);
            }
        }
    }

    linkSingle (ids, currents, params) {
        if (ids[0] === currents[0]) {
            return this.clear();
        }
        if (this.deletes.length || (params.delete && !params.unlink)) {
            this.unlinks = [];
            this.deletes = currents;
        } else {
            this.unlinks = currents;
            this.deletes = [];
        }
        this.links = ids;
    }

    linkMultiple (ids) {
        const rest = Jam.ArrayHelper.exclude(this.links, ids);
        this.links = this.links.concat(rest);
        this.unlinks = Jam.ArrayHelper.exclude(ids, this.unlinks);
        this.deletes = Jam.ArrayHelper.exclude(ids, this.deletes);
    }

    unlinkObjects (ids) {
        this.links = Jam.ArrayHelper.exclude(ids, this.links);
        const rest = Jam.ArrayHelper.exclude(this.unlinks, ids);
        this.unlinks = this.unlinks.concat(rest);
        this.deletes = Jam.ArrayHelper.exclude(ids, this.deletes);
    }

    deleteObjects (ids) {
        this.links = Jam.ArrayHelper.exclude(ids, this.links);
        this.unlinks = Jam.ArrayHelper.exclude(ids, this.unlinks);
        const rest = Jam.ArrayHelper.exclude(this.deletes, ids);
        this.deletes = this.deletes.concat(rest);
    }

    revertMultiple (ids) {
        return this.revertItems('unlinks', ids)
            || this.revertItems('deletes', ids);
    }

    revertSingle (ids) {
        const reverted = this.revertMultiple(ids);
        if (reverted) {
            this.unlinks = this.links;
            this.links = [];
        }
        return reverted;
    }

    revertItems (key, ids) {
        let reverted = false;
        for (const id of ids) {
            const index = this[key].indexOf(id);
            if (index !== -1) {
                this[key].splice(index, 1);
                reverted = true;
            }
        }
        return reverted;
    }
};