'use strict';

Ant.DataGrid.Provider = class {

    constructor (grid) {
        this.grid = grid;
        this.params = grid.params;
        this.initColumns();
    }

    initColumns () {
        for (let column of this.params.columns) {
            column.formatFilterValue = column.format instanceof Function
                ? column.format
                : this.formatFilterValue.bind(this)
        }
    }

    load () {
        let data = this.params.data;
        let maxSize = data.length;
        data = this.useCommonSearch(data);
        this.orderData(data, this.grid.order);
        let totalSize = data.length;
        let interval = this.grid.pagination.getDataInterval(totalSize);
        let pageData = data.slice.apply(data, interval);
        this.grid.afterLoad(pageData, totalSize, maxSize);
    }

    // FILTER DATA

    useCommonSearch (data) {
        let value = this.grid.commonSearch.getValue();
        if (value === null) {
            return data;
        }
        let keys = [];
        for (let column of this.params.columns) {
            if (column.searchable) {
                keys.push(this.createColumnFilterValues(column, data));
            }
        }
        return data.filter(this.filterItem.bind(this, value, keys));
    }

    filterItem (value, keys, doc) {
        for (let key of keys) {
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

    // ORDER DATA

    orderData (data, order) {
        if (!order) {
            return false;
        }
        this._sortItems = [];
        for (let name of Object.keys(order)) {
            let column = this.grid.getColumn(name);
            if (column && column.sortable) {
                let key = this.createColumnFilterValues(column, data);
                this._sortItems.push([key, order[name]]);
            }
        }
        if (this._sortItems.length) {
            data.sort(this.compareDocs.bind(this));
        }
    }

    compareDocs (a, b) {
        for (let item of this._sortItems) {
            let result = this.compareValues(a[item[0]], b[item[0]], item[1]);
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

    // FORMAT

    createColumnFilterValues (column, data) {
        let key = '_aretoDataGridFilter_'+ column.name;
        if (data.length && !data[0].hasOwnProperty(key)) {
            for (let doc of data) {
                doc[key] = column.formatFilterValue(doc[column.name], column, doc)
            }
        }
        return key;
    }

    formatFilterValue (value, column) {
        return value;
    }

};