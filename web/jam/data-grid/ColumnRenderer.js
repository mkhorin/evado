/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const FORMAT_METHODS = {
    boolean: 'asBoolean',
    bytes: 'asBytes',
    date: 'asDate',
    datetime: 'asDatetime',
    time: 'asTime',
    timestamp: 'asTimestamp',
    link:'asLink',
    relation: 'asRelation',
    select: 'asSelect',
    thumbnail: 'asThumbnail',
    title: 'asTitle'
};

Jam.ColumnRenderer = class ColumnRenderer {

    getRenderMethod (data) {
        const name = typeof data === 'string' ? data : data ? data.name : null;
        const method = this.getFormatMethod(name);
        return this.render.bind(this, method);
    }

    getFormatMethod (name) {
        return FORMAT_METHODS.hasOwnProperty(name) ? this[FORMAT_METHODS[name]] : this.asDefault;
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

    render (method, value, column, data) {
        if (value === undefined || value === null) {
            return this.asNotSet(value, column);
        }
        if (Array.isArray(value) && !value.length) {
            return this.asNotSet(null, column);
        }
        if (column.escape === undefined) {
            column.escape = true;
        }
        const result = method.call(this, value, column, data);
        return typeof result === 'object'
            ? this.escape(JSON.stringify(result, null, 1), column)
            : result;
    }

    translate (value, column) {
        return typeof column.translateData === 'string'
            ? Jam.i18n.translate(value, column.translateData)
            : value;
    }

    join (handler, value, column, data) {
        if (!Array.isArray(value)) {
            return handler.call(this, value, column, data);
        }
        let separator = '<br>';
        if (column.format && column.format.hasOwnProperty('separator')) {
            separator = column.format.separator;
        } else if (column.hasOwnProperty('separator')) {
            separator = column.separator;
        }
        return value.map(value => handler.call(this, value, column, data)).join(separator);
    }

    asDefault (value, column) {
        return this.join(value => this.escape(this.translate(value, column), column), ...arguments);
    }

    asBoolean () {
        return this.join(Jam.FormatHelper.asBoolean, ...arguments);
    }

    asBytes () {
        return this.join(Jam.FormatHelper.asBytes, ...arguments);
    }

    asDate () {
        return this.join((value, {momentFormat, utc}) => {
            return Jam.FormatHelper.asDate(Jam.DateHelper.formatByUtc(value, utc), momentFormat);
        }, ...arguments);
    }

    asDatetime () {
        return this.join((value, {momentFormat, utc}) => {
            return Jam.FormatHelper.asDatetime(Jam.DateHelper.formatByUtc(value, utc), momentFormat);
        }, ...arguments);
    }

    asEmbeddedModel (data, column) {
        return this.escape(this.translate(data[1], column), column);
    }

    asMetaItem (data, column) {
        return this.escape(this.translate(data[1], column), column);
    }

    asTime () {
        return this.join((value, {momentFormat}) => Jam.FormatHelper.asTime(data, momentFormat), ...arguments);
    }

    asTimestamp () {
        return this.join((data, {momentFormat, utc}) => {
            return Jam.FormatHelper.asTimestamp(Jam.DateHelper.formatByUtc(data, utc), momentFormat);
        }, ...arguments);
    }

    asRelation () {
        return this.asLink(...arguments);
    }

    asLink (value, column) {
        return this.join(this.parseLink, ...arguments);
    }

    asNotSet () {
        return this.join(Jam.FormatHelper.asNotSet, ...arguments);
    }

    asSelect (value, column) {
        return this.escape(column.format.itemIndex[value].label, column);
    }

    asTitle (value, column) {
        return this.join((value, column, data) => {
            value = data[column.titleName] || value;
            return this.escape(this.translate(value, column), column);
        }, ...arguments);
    }

    asThumbnail (value, column) {
        return this.join(this.parseThumbnail, ...arguments);
    }

    parseThumbnail (value, {format}) {
        if (!value) {
            return Jam.FormatHelper.asNotSet();
        }
        const thumbnail = Jam.FormatHelper.asThumbnail(value);
        const url = value.url || format.url;
        return url ? this.renderLink(url, thumbnail, value, format) : thumbnail;
    }

    parseLink (value, column) {
        if (!value) {
            return Jam.FormatHelper.asNotSet();
        }
        let text = value.hasOwnProperty('text') ? value.text : value;
        let url = value.url || column.format.url;
        if (!url || text === null || text === undefined) {
            return this.render(this.asDefault, text, column);
        }
        text = this.escape(this.translate(text, column), column);
        return this.renderLink(url, text, value, column.format);
    }

    renderLink (url, content, data, format) {
        const params = data.id || data.params
            ? {id: data.id, ...data.params}
            : {id: content};
        url += (url.includes('?') ? '&' : '?') + $.param({...format.params, ...params});
        return `<a href="${url}" class="modal-link">${content}</a>`;
    }
};