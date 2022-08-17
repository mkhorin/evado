/**
 * @copyright Copyright (c) 2021 Maxim Khorin <maksimovichu@gmail.com>
 */
Jam.ListDataFormatter = class ListDataFormatter {

    static METHODS = {
        boolean: 'asBoolean',
        bytes: 'asBytes',
        date: 'asDate',
        datetime: 'asDatetime',
        json: 'asJson',
        label:'asDefault',
        link:'asLink',
        mask:'asMask',
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
        if (!value.length) {
            return this.asNotSet(null, params);
        }
        let separator = '<div class="separator"></div>';
        if (params.format?.hasOwnProperty('separator')) {
            separator = params.format.separator;
        } else if (params.hasOwnProperty('separator')) {
            separator = params.separator;
        }
        return value
            .map((value, index) => handler.call(this, value, params, data, index))
            .join(separator);
    }

    asDefault () {
        return this.join((value, params) => this.escape(this.translate(value, params), params), ...arguments);
    }

    asBoolean () {
        return this.join(Jam.FormatHelper.asBoolean, ...arguments);
    }

    asBytes () {
        return this.join(Jam.FormatHelper.asBytes, ...arguments);
    }

    asDate () {
        return this.join((value, {dateFormat, utc}) => {
            return Jam.FormatHelper.asDate(Jam.DateHelper.formatByUtc(value, utc), dateFormat);
        }, ...arguments);
    }

    asDatetime () {
        return this.join((value, {dateFormat, utc}) => {
            return Jam.FormatHelper.asDatetime(Jam.DateHelper.formatByUtc(value, utc), dateFormat);
        }, ...arguments);
    }

    asJson (data, params) {
        return this.escape(JSON.stringify(data, null, 1), params);
    }

    asEmbeddedModel (data, params) {
        return this.escape(this.translate(data[1], params), params);
    }

    asMetaItem (data, params) {
        return this.escape(this.translate(data[1], params), params);
    }

    asTime () {
        return this.join((value, {dateFormat}) => Jam.FormatHelper.asTime(data, dateFormat), ...arguments);
    }

    asTimestamp () {
        return this.join((data, {dateFormat, utc}) => {
            return Jam.FormatHelper.asTimestamp(Jam.DateHelper.formatByUtc(data, utc), dateFormat);
        }, ...arguments);
    }

    asRelation () {
        return this.asLink(...arguments);
    }

    asLink (value, params) {
        return this.join(this.parseLink, ...arguments);
    }

    asMask (value, params) {
        return this.join(this.parseMask, ...arguments);
    }

    asNotSet () {
        return this.join(Jam.FormatHelper.asNotSet, ...arguments);
    }

    asSelect (value, params) {
        return this.escape(params.format.itemIndex[value].label, params);
    }

    asTitle (value, params) {
        return this.join(this.parseTitle, ...arguments);
    }

    asThumbnail () {
        return this.join(this.parseThumbnail, ...arguments);
    }

    parseMask (value, params) {
        return Jam.FormatHelper.asMask(value, params.format.params);
    }

    parseTitle (value, params, data, index) {
        const title = data[params.titleName];
        value = (index === undefined ? title : title?.[index]) || value;
        return this.escape(this.translate(value, params), params);
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