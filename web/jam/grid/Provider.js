/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
Jam.DataGridProvider = class DataGridProvider {

    constructor (grid) {
        this.grid = grid;
        this.params = grid.params;
        this.prepareColumns();
    }

    prepareColumns () {
        for (const column of this.params.columns) {
            column.formatFilterValue = typeof column.format === 'function'
                ? column.format
                : this.formatFilterValue.bind(this);
        }
    }

    load () {
        let {data} = this.params;
        const maxSize = data.length;
        data = this.useCommonSearch(data);
        this.sortData(data, this.getOrder());
        const totalSize = data.length;
        const interval = this.grid.pagination.getDataInterval(totalSize);
        const items = data.slice(...interval);
        this.grid.afterLoad({items, totalSize, maxSize});
    }

    getOrder () {
        return {...this.grid.grouping, ...this.grid.order};
    }

    useCommonSearch (data) {
        const value = this.grid.search.getValue();
        if (value === null) {
            return data;
        }
        const keys = [];
        for (const column of this.params.columns) {
            if (column.searchable) {
                const key = this.createColumnFilterValues(column, data);
                keys.push(key);
            }
        }
        return data.filter(this.filterItem.bind(this, value, keys));
    }

    filterItem (value, keys, doc) {
        for (const key of keys) {
            if (typeof doc[key] === 'string') {
                if (doc[key].includes(value)) {
                    return true;
                }
            } else if (doc[key] === value) {
                return true;
            }
        }
        return false;
    }

    sortData (data, order) {
        if (!order) {
            return false;
        }
        this._sortItems = [];
        for (const name of Object.keys(order)) {
            const column = this.grid.getColumn(name);
            if (column?.sortable) {
                const key = this.createColumnFilterValues(column, data);
                this._sortItems.push([key, order[name]]);
            }
        }
        if (this._sortItems.length) {
            data.sort(this.compareDocs.bind(this));
        }
    }

    compareDocs (a, b) {
        for (const [key, direction] of this._sortItems) {
            const result = this.compareValues(a[key], b[key], direction);
            if (result !== 0) {
                return result;
            }
        }
        return 0;
    }

    compareValues (a, b, direction) {
        if (typeof a === 'string') {
            return a.localeCompare(b) * direction;
        }
        return a > b ? direction : a < b ? -direction : 0;
    }

    createColumnFilterValues (column, data) {
        const key = '_dataGridFilter_'+ column.name;
        if (data.length && !data[0].hasOwnProperty(key)) {
            for (const doc of data) {
                doc[key] = column.formatFilterValue(doc[column.name], column, doc)
            }
        }
        return key;
    }

    formatFilterValue (value) {
        return typeof value === 'string' ? value.toLowerCase() : value;
    }
};