'use strict';

Ant.ColumnRenderHelper = class {

    static get (format) {
        let method = this.asDefault;
        format = typeof format === 'string' ? format : format ? format.name : null;
        switch (format) {
            case 'boolean': method = this.asBoolean; break;
            case 'date': method =  this.asDate; break;
            case 'datetime': method = this.asDatetime; break;
            case 'timestamp': method = this.asTimestamp; break;
            case 'escaped': method = this.asEscaped; break;
            case 'json': method = this.asJson; break;
            case 'link': method = this.asLink; break;
            case 'list': method = this.asList; break;
            case 'select': method = this.asSelect; break;
            case 'thumb': method = this.asThumb; break;
        }
        return this.render.bind(this, method);
    }

    static prepareFormat (data) {
        if (data) {
            switch (data.name) {
                case 'select': return this.prepareSelect(data);
            }
        }
        return data;
    }

    static prepareSelect (data) {
        if (data && Array.isArray(data.items)) {
            data.itemIndex = Ant.ArrayHelper.index('value', data.items);
        }
        return data;
    }

    static render (method, value, column) {
        return value === undefined || value === null
            ? this.asNotSet(value)
            : method.call(this, value, column);
    }

    static asNotSet (value) {
        return `<span class="not-set">${value}</span>`;
    }

    static asDefault (value, column) {
        if (!Array.isArray(value)) {
            return value;
        }
        return value.join(column.hasOwnProperty('separator') ? column.separator : '<br>');
    }

    static asBoolean (value) {
        return parseInt(value) === 0 ? 'no' : 'yes';
    }

    static asDate (value) {
        return value ? (new Date(value)).toLocaleDateString() : '';
    }

    static asDatetime (value) {
        return value ? (new Date(value)).toLocaleString() : '';
    }

    static asTimestamp (value) {
        return value ? moment(value).format('L LTS') : '';
    }

    static asEscaped (value) {
        return Ant.Helper.escapeHtml(value);
    }

    static asJson (value) {
        return value ? JSON.stringify(value) : '';
    }

    static asLink (value, column) {
        let url = column.format.url;
        if (column.format.key) {
            column.format.params[column.format.key] = value;
            url = `${url}?${$.param(column.format.params)}`;
        }
        return `<a href="${url}" class="modal-link">${value}</a>`;
    }

    static asList (value, column) {
        if (!Array.isArray(value)) {
            return '';
        }
        if (typeof column.format === 'string') {
            return value.join('<br>');
        }
        let result = [];
        for (let item of value) {
            if (!column.format.url) {
                result.push(item.title);
                continue;
            }
            let url = column.format.url;
            if (item.params) {
                url += '?'+ $.param(item.params);
            }
            result.push(`<a href="${url}" class="modal-link">${item.title}</a>`);
        }
        return result.join(column.format.separator || '<br>');
    }

    static asSelect (value, column) {
        return column.format.itemIndex[value].label;
    }

    static asThumb (value) {
        return value ? `<img src="${value}" class="thumbnail">` : '';
    }
};