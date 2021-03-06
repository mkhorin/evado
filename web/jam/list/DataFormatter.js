/**
 * @copyright Copyright (c) 2021 Maxim Khorin <maksimovichu@gmail.com>
 */
Jam.ListDataFormatter = class ListDataFormatter {

    static METHODS = {
        boolean: 'asBoolean',
        bytes: 'asBytes',
        date: 'asDate',
        datetime: 'asDatetime',
        label:'asDefault',
        link:'asLink',
        relation: 'asRelation',
        select: 'asSelect',
        thumbnail: 'asThumbnail',
        time: 'asTime',
        timestamp: 'asTimestamp',
        title: 'asTitle'
    };

    getRenderingMethod (data) {
        const name = typeof data === 'string' ? data : data ? data.name : null;
        const method = this.getFormattingMethod(name);
        return this.render.bind(this, method);
    }

    getFormattingMethod (name) {
        if (!name) {
            return this.asDefault;
        }
        if (Jam.ObjectHelper.has(name, this.constructor.METHODS)) {
            return this[this.constructor.METHODS[name]];
        }
        console.error(`Formatting method not found: ${name}`);
        return this.asDefault;
    }

    escape (message, {escape}) {
        return escape ? Jam.escape(message) : message;
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
        if (Array.isArray(data?.items)) {
            data.itemIndex = Jam.ArrayHelper.index('value', data.items);
        }
        return data;
    }

    render (method, value, params, data) {
        if (value === undefined || value === null) {
            return this.asNotSet(value, params);
        }
        if (Array.isArray(value) && !value.length) {
            return this.asNotSet(null, params);
        }
        if (params.escape === undefined) {
            params.escape = true;
        }
        const result = method.call(this, value, params, data);
        return typeof result === 'object'
            ? this.escape(JSON.stringify(result, null, 1), params)
            : result;
    }

    translate (value, params) {
        return typeof params.translateData === 'string'
            ? Jam.t(value, params.translateData)
            : value;
    }

    join (handler, value, params, data) {
        if (!Array.isArray(value)) {
            return handler.call(this, value, params, data);
        }
        let separator = '<br>';
        if (params.format?.hasOwnProperty('separator')) {
            separator = params.format.separator;
        } else if (params.hasOwnProperty('separator')) {
            separator = params.separator;
        }
        return value.map(value => handler.call(this, value, params, data)).join(separator);
    }

    asDefault (value, params) {
        return this.join(value => this.escape(this.translate(value, params), params), ...arguments);
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

    asEmbeddedModel (data, params) {
        return this.escape(this.translate(data[1], params), params);
    }

    asMetaItem (data, params) {
        return this.escape(this.translate(data[1], params), params);
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

    asLink (value, params) {
        return this.join(this.parseLink, ...arguments);
    }

    asNotSet () {
        return this.join(Jam.FormatHelper.asNotSet, ...arguments);
    }

    asSelect (value, params) {
        return this.escape(params.format.itemIndex[value].label, params);
    }

    asTitle (value, params) {
        return this.join((value, params, data) => {
            value = data[params.titleName] || value;
            return this.escape(this.translate(value, params), params);
        }, ...arguments);
    }

    asThumbnail (value, params) {
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

    parseLink (value, params) {
        if (!value) {
            return Jam.FormatHelper.asNotSet();
        }
        let text = value.hasOwnProperty('text') ? value.text : value;
        let url = value.url || params.format.url;
        if (!url || text === null || text === undefined) {
            return this.render(this.asDefault, text, params);
        }
        text = this.escape(this.translate(text, params), params);
        return this.renderLink(url, text, value, params.format);
    }

    renderLink (url, content, data, format) {
        const params = data.id || data.params
            ? {id: data.id, ...data.params}
            : {id: content};
        url += (url.includes('?') ? '&' : '?') + $.param({...format.params, ...params});
        return `<a href="${url}" class="frame-link">${content}</a>`;
    }
};