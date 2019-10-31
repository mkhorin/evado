/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

Jam.ColumnRenderer = class ColumnRenderer {

    static getRenderMethod (format) {
        const name = typeof format === 'string' ? format : format ? format.name : null;
        const method = this.getFormatMethod(name);
        return this.render.bind(this, method);
    }

    static getFormatMethod (name) {
        switch (name) {
            case 'boolean': return this.asBoolean;
            case 'date': return this.asDate;
            case 'datetime': return this.asDatetime;
            case 'timestamp': return this.asTimestamp;
            case 'escaped': return this.asEscaped;
            case 'json': return this.asJson;
            case 'link': return this.asLink;
            case 'select': return this.asSelect;
            case 'thumb': return this.asThumb;
        }
        return this.asDefault;
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
        if (data === undefined) {
            return this.asNotSet();
        }
        if (data === null) {
            return this.asNull();
        }
        const result = method.call(this, data, column);
        if (typeof result === 'object') {
            return JSON.stringify(result, null, 1);
        }
        if (typeof column.translate === 'string') {
            return Jam.i18n.translate(result, column.translate);
        }
        return result;
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

    static asDefault () {
        return this.join(...arguments, data => data);
    }

    static asBoolean () {
        return this.join(...arguments, Jam.FormatHelper.asBoolean);
    }

    static asDate () {
        return this.join(...arguments, Jam.FormatHelper.asDate);
    }

    static asDatetime () {
        return this.join(...arguments, Jam.FormatHelper.asDatetime);
    }

    static asTimestamp () {
        return this.join(...arguments, Jam.FormatHelper.asTimestamp);
    }

    static asEscaped () {
        return this.join(...arguments, Jam.Helper.escapeHtml);
    }

    static asJson (data) {
        return data ? JSON.stringify(data, null, 1) : '';
    }

    static asLink () {
        return this.join(...arguments, (data, {format}) => {
            let text = data.hasOwnProperty('text') ? data.text : data;
            let url = data.url || format.url || '';
            if (!url) {
                return text;
            }
            let params = data.id || data.params 
                ? {id: data.id, ...data.params} 
                : {id: text};
            params = $.param({...format.params, ...params});
            url += (url.includes('?') ? '&' : '?') + params;
            return `<a href="${url}" class="modal-link">${text}</a>`;
        });
    }

    static asNotSet () {
        return `<span class="not-set">[${Jam.i18n.translate('not set')}]</span>`;
    }

    static asNull () {
        return '<span class="not-set">null</span>';
    }

    static asSelect (data, {format}) {
        return format.itemIndex[data].label;
    }

    static asThumb () {
        return this.join(...arguments, Jam.FormatHelper.asThumb);
    }
};