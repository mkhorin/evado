/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

Jam.ColumnRenderer = class ColumnRenderer {

    getRenderMethod (data) {
        const name = typeof data === 'string' ? data : data ? data.name : null;
        const method = this.getFormatMethod(name);
        return this.render.bind(this, method);
    }

    getFormatMethod (name) {
        switch (name) {
            case 'boolean': return this.asBoolean;
            case 'bytes': return this.asBytes;
            case 'date': return this.asDate;
            case 'datetime': return this.asDatetime;
            case 'time': return this.asTime;
            case 'timestamp': return this.asTimestamp;
            case 'link': return this.asLink;
            case 'relation': return this.asLink;
            case 'select': return this.asSelect;
            case 'thumbnail': return this.asThumbnail;
        }
        return this.asDefault;
    }

    escape (message, {escape}) {
        return escape ? Jam.Helper.escapeTags(message) : message;
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
        if (data === undefined || data === null) {
            return this.asNotSet(data, column);
        }
        if (column.escape === undefined) {
            column.escape = true;
        }
        const result = method.call(this, data, column);
        return typeof result === 'object'
            ? this.escape(JSON.stringify(result, null, 1), column)
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
        return this.join(...arguments, data => {
            return this.escape(this.translate(data, column), column);
        });
    }

    asBoolean () {
        return this.join(...arguments, Jam.FormatHelper.asBoolean);
    }

    asBytes () {
        return this.join(...arguments, Jam.FormatHelper.asBytes);
    }

    asDate () {
        return this.join(...arguments, (data, {momentFormat, utc}) => {
            return Jam.FormatHelper.asDate(Jam.DateHelper.formatByUtc(data, utc), momentFormat);
        });
    }

    asDatetime () {
        return this.join(...arguments, (data, {momentFormat, utc}) => {
            return Jam.FormatHelper.asDatetime(Jam.DateHelper.formatByUtc(data, utc), momentFormat);
        });
    }

    asTime () {
        return this.join(...arguments, (data, {momentFormat}) => Jam.FormatHelper.asTime(data, momentFormat));
    }

    asTimestamp () {
        return this.join(...arguments, (data, {momentFormat, utc}) => {
            return Jam.FormatHelper.asTimestamp(Jam.DateHelper.formatByUtc(data, utc), momentFormat);
        });
    }

    asLink (data, column) {
        return this.join(...arguments, (data, {format}) => {
            if (!data) {
                return Jam.FormatHelper.asInvalidData();
            }
            let text = data.hasOwnProperty('text') ? data.text : data;
            let url = data.url || format.url;
            if (!url || text === null || text === undefined) {
                return this.render(this.asDefault, text, column);
            }
            text = this.escape(this.translate(text, column), column);
            return this.renderLink(url, text, data, format);
        });
    }

    asNotSet () {
        return this.join(...arguments, Jam.FormatHelper.asNotSet);
    }

    asSelect (data, column) {
        return this.escape(column.format.itemIndex[data].label, column);
    }

    asThumbnail (data, column) {
        return this.join(...arguments, (data, {format}) => {
            if (!data) {
                return Jam.FormatHelper.asInvalidData();
            }
            const thumbnail = Jam.FormatHelper.asThumbnail(data);
            const url = data.url || format.url;
            return url ? this.renderLink(url, thumbnail, data, format) : thumbnail;
        });
    }

    renderLink (url, content, data, format) {
        const params = data.id || data.params
            ? {id: data.id, ...data.params}
            : {id: content};
        url += (url.includes('?') ? '&' : '?') + $.param({...format.params, ...params});
        return `<a href="${url}" class="modal-link">${content}</a>`;
    }
};