/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
Jam.DataGridAjaxProvider = class DataGridAjaxProvider {

    constructor (grid) {
        this.grid = grid;
        this.params = grid.params;
    }

    load () {
        this.abort();
        const request = this.getRequestParams();
        this.trigger('beforeXhr', {request});
        if (request.dataType === 'json') {
            request.data = JSON.stringify(request.data);
        }
        if (request.url.indexOf('/') !== 0) {
            request.url = document.baseURI + request.url;
        }
        this._xhr = $.ajax(request)
            .done(this.done.bind(this))
            .fail(this.fail.bind(this));
    }

    done (data) {
        this.trigger('afterXhr', {data});
        this.grid.afterLoad(this.resolveData(data));
    }

    resolveData (data) {
        return {
            items: data?.items || [],
            totalSize: data?.totalSize || 0,
            maxSize: data?.maxSize || 0
        };
    }

    fail (data) {
        this.grid.fail(data);
    }

    abort () {
        this._xhr?.abort();
        this._xhr = null;
    }

    trigger (name, data) {
        this.grid.events.trigger(name, {grid: this.grid, ...data});
    }

    getRequestParams () {
        return {
            method: 'post',
            dataType: 'json',
            contentType: 'application/json',
            data: this.getRequestData(),
            ...this.params.ajax
        };
    }

    getRequestData (data) {
        const length = this.grid.pagination.pageSize;
        return {
            length,
            columns: this.params.columns,
            start: this.grid.pagination.page * length,
            search: this.grid.search.getValue(),
            order: this.getOrder(),
            dependency: this.params.dependency,
            ...this.params.requestData,
            ...data
        };
    }

    getOrder () {
        return {...this.grid.grouping, ...this.grid.order};
    }
};