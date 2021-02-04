/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
Jam.AttrListChanges = class AttrListChanges {

    constructor (attr) {
        this.attr = attr;
        this.clear();
    }

    isEmpty () {
        return !this.data.links.length
            && !this.data.unlinks.length
            && !this.data.deletes.length;
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

    clear () {
        this.data = {links: [], unlinks: [], deletes: []};
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

    linkSingle (ids, currents, params) {
        if (ids[0] === currents[0]) {
            return this.clear();
        }
        if (this.data.deletes.length || (params.delete && !params.unlink)) {
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