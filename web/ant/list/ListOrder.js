'use strict';

Ant.ListOrder = class {

    constructor (owner, params) {
        if (typeof params === 'string') {
            this.url = params;
        } else {
            this.params = params;
            this.url = params.url;
            this.columns = params.columns;
        }
        this.owner = owner;
    }

    execute () {
        if (!Array.isArray(this.columns)) {
            return this.load(this.getUrl());
        }
        if (this.columns.length === 1) {
            return this.load(this.getUrl(this.columns[0]));
        }
        let names = this.getOrderedNames();
        if (names.length === 1 && this.columns.includes(names[0])) {
            return this.load(this.getUrl(names[0]));
        }
        this.owner.notice.warning('Select column to order');
    }

    getOrderedNames () {
        return this.owner.grid.order ? Object.keys(this.owner.grid.order) : [];
    }

    getUrl (column) {
        return column ? `${this.url}${column}` : this.url;
    }

    load (url) {
        this.owner.loadModal(url, null, (event, data)=> {
            data && data.saved && this.owner.reload();
        });
    }
};