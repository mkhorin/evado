'use strict';

Ant.DataGrid.AjaxProvider = class {

    constructor (grid) {
        this.grid = grid;
        this.params = grid.params;
    }

    abort () {
        if (this._xhr) {
            this._xhr.abort();
            this._xhr = null;
        }
    }

    load () {
        this.abort();
        let params = {
            'method': 'post',
            'dataType': 'json',
            'contentType': 'application/json',
            ...this.params.ajax
        };
        let length = this.grid.pagination.pageSize;
        params.data = {
            'columns': this.params.columns,
            'start': this.grid.pagination.page * length,
            'length': length,
            'search': this.grid.commonSearch.getValue(),
            'order': this.grid.order
        };
        this.grid.event.trigger('beforeXhr', {
            'params': params.data,
            'grid': this.grid
        });
        if (params.dataType === 'json') {
            params.data = JSON.stringify(params.data);
        }
        this._xhr = $.ajax(params)
            .done(this.done.bind(this))
            .fail(this.fail.bind(this));
    }

    done (data) {
        this.grid.event.trigger('afterXhr', {
            'data': data,
            'grid': this.grid
        });
        let maxSize = data ? data.maxSize : 0;
        let totalSize = data ? data.totalSize : 0;
        let items = data ? data.items : [];
        this.grid.afterLoad(items, totalSize, maxSize);
    }

    fail (xhr) {
        this.grid.fail(xhr);
    }
};