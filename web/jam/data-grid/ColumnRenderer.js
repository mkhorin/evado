/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

Jam.ColumnRenderer = class ColumnRenderer {

    getRenderMethod (format) {
        const name = typeof format === 'string' ? format : format ? format.name : null;
        const method = this.getFormatMethod(name);
        return this.render.bind(this, method);
    }

    getFormatMethod (name) {
        switch (name) {
            case 'boolean': return this.asBoolean;
            case 'bytes': return this.asBytes;
            case 'date': return this.asDate;
            case 'datetime': return this.asDatetime;
            case 'timestamp': return this.asTimestamp;
            case 'escaped': return this.asEscaped;
            case 'link': return this.asLink;
            case 'relation': return this.asLink;
            case 'select': return this.asSelect;
            case 'preview': return this.asPreview;
        }
        return this.asDefault;
    }

    prepareFormat (data) {
        if (data) {
            switch (data.name) {
                case 'select': return this.prepareSelect(data);
            }
        }
        return data;
    }

    prepareSelect (data) {
        if (data && Array.isArray(data.items)) {
            data.itemIndex = Jam.ArrayHelper.index('value', data.items);
        }
        return data;
    }

    render (method, data, column) {
        if (data === undefined) {
            return this.asNotSet();
        }
        if (data === null) {
            return this.asNull();
        }
        const result = method.call(this, data, column);
        return typeof result === 'object'
            ? JSON.stringify(result, null, 1)
            : result;
    }

    translate (data, column) {
        return typeof column.translate === 'string'
            ? Jam.i18n.translate(data, column.translate)
            : data;
    }

    join (data, column, handler) {
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

    asDefault (data, column) {
        return this.join(...arguments, this.translate.bind(this));
    }

    asBoolean () {
        return this.join(...arguments, Jam.FormatHelper.asBoolean);
    }

    asBytes () {
        return this.join(...arguments, Jam.FormatHelper.asBytes);
    }

    asDate () {
        return this.join(...arguments, (data, {momentFormat, utc})=> {
            return Jam.FormatHelper.asDate(Jam.DateHelper.formatByUtc(data, utc), momentFormat);
        });
    }

    asDatetime () {
        return this.join(...arguments, (data, {momentFormat, utc})=> {
            return Jam.FormatHelper.asDatetime(Jam.DateHelper.formatByUtc(data, utc), momentFormat);
        });
    }

    asTimestamp () {
        return this.join(...arguments, (data, {momentFormat, utc})=> {
            return Jam.FormatHelper.asTimestamp(Jam.DateHelper.formatByUtc(data, utc), momentFormat);
        });
    }

    asEscaped () {
        return this.join(...arguments, Jam.Helper.escapeHtml);
    }

    asLink (data, column) {
        return this.join(...arguments, (data, {format}) => {
            let text = data.hasOwnProperty('text') ? data.text : data;
            let url = data.url || format.url || '';
            if (!url || text === null || text === undefined) {
                return this.render(this.asDefault, text, column);
            }
            let params = data.id || data.params 
                ? {id: data.id, ...data.params} 
                : {id: text};
            params = $.param({...format.params, ...params});
            url += (url.includes('?') ? '&' : '?') + params;
            text = this.translate(text, column);
            return `<a href="${url}" class="modal-link">${text}</a>`;
        });
    }

    asNotSet () {
        return `<span class="not-set">[${Jam.i18n.translate('not set')}]</span>`;
    }

    asNull () {
        return '<span class="not-set">null</span>';
    }

    asSelect (data, {format}) {
        return format.itemIndex[data].label;
    }

    asPreview () {
        return this.join(...arguments, Jam.FormatHelper.asPreview);
    }
};