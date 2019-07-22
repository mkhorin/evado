/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

Jam.ColumnRenderHelper = class {

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
            data.itemIndex = Jam.ArrayHelper.index('value', data.items);
        }
        return data;
    }

    static render (method, data, column) {
        return data === undefined || data === null
            ? this.asNotSet(data)
            : method.call(this, data, column);
    }

    static join (data, column, handler) {
        if (!Array.isArray(data)) {
            return handler(data, column);
        }
        let separator = '<br>';
        if (column.format && column.format.hasOwnProperty('separator')) {
            separator = column.format.separator;
        } else if (column.hasOwnProperty('separator')) {
            separator = column.separator;
        }
        return data.map(data => handler(data, column)).join(separator);
    }

    static asNotSet (data) {
        return `<span class="not-set">${data}</span>`;
    }

    static asDefault () {
        return this.join(...arguments, data => data);
    }

    static asBoolean () {
        return this.join(...arguments, data => {
            return Jam.i18n.translate(Number(data) === 0 ? 'No' : 'Yes');
        });
    }

    static asDate () {
        return this.join(...arguments, data => {
            return data ? (new Date(data)).toLocaleDateString() : '';
        });
    }

    static asDatetime () {
        return this.join(...arguments, data => {
            return dava ? (new Date(data)).toLocaleString() : '';
        });
    }

    static asTimestamp () {
        return this.join(...arguments, data => {
            return data ? moment(data).format('L LTS') : '';
        });
    }

    static asEscaped () {
        return this.join(...arguments, data => Jam.Helper.escapeHtml(data));
    }

    static asJson (data) {
        return data ? JSON.stringify(data) : '';
    }

    static asLink () {
        return this.join(...arguments, (data, {format}) => {
            let url = data.url || format.url || '';
            let text = data.hasOwnProperty('text') ? data.text : data;
            if (!url) {
                return text;
            }
            let params = data.id || data.params ? {id: data.id, ...data.params} : {id: text};
            params = $.param({...format.params, ...params});
            url += (url.indexOf('?') === -1 ? '?' : '&') + params;
            return `<a href="${url}" class="modal-link">${text}</a>`;
        });
    }

    static asSelect (data, {format}) {
        return format.itemIndex[data].label;
    }

    static asThumb () {
        return this.join(...arguments, data => {
            return data ? `<img src="${data}" class="thumbnail">` : '';
        });
    }
};