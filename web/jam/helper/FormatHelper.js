/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
Jam.FormatHelper = class FormatHelper {

    static asBoolean (data) {
        const num = Number(data);
        return isNaN(num) ? data : Jam.t(num === 0 ? 'No' : 'Yes');
    }

    static asBytes (size) {
        size = Number(size);
        if (isNaN(size)) {
            return '';
        }
        let unit;
        if (size < 1024) {
            unit = 'B';
        } else if (size < 1048576) {
            unit = 'KiB';
            size /= 1024;
        } else if (size < 1073741824) {
            unit = 'MiB';
            size /= 1048576;
        } else {
            unit = 'GiB';
            size /= 1073741824;
        }
        size = Math.round((size + Number.EPSILON) * 100) / 100;
        return `${size} ${Jam.t(unit)}`;
    }

    static asCurrency (data, ...params) {
        return new Intl.NumberFormat(...params).format(Math.round((data + Number.EPSILON) * 100) / 100);
    }

    static asDate (data, format = 'L') {
        const date = moment(data);
        return !data ? '' : date.isValid() ? date.format(format) : data;
    }

    static asDatetime (data, format = 'L LTS') {
        return this.asDate(data, format);
    }

    static asInvalidData () {
        return `<span class="not-set">${Jam.t('[invalid data]')}</span>`;
    }

    static asMask (data) {
        return data !== '' ? Jam.ValueMask.format(...arguments) : data;
    }

    static asNoAccess () {
        return `<span class="no-access">${Jam.t('[no access]')}</span>`;
    }

    static asNotSet () {
        return `<span class="not-set">${Jam.t('[not set]')}</span>`;
    }

    static asNotSetOnEmpty (data) {
        return data || data === 0 ? data : this.asNotSet();
    }

    static asSpinner () {
        return `<i class="fa fa-spinner fa-spin"></i>`;
    }

    static asTime (data, format = 'LT') {
        data = parseInt(data);
        return !isNaN(data)
            ? moment().startOf('day').add(moment.duration({s: data})).format(format)
            : null;
    }

    static asTimestamp () {
        return this.asDatetime(...arguments);
    }

    static asThumbnail (data) {
        if (!data || !data.thumbnail && !data.name) {
            return data;
        }
        const name = Jam.StringHelper.escapeTags(data.name);
        return data.thumbnail
            ? `<img src="${data.thumbnail}" class="img-thumbnail img-fluid ${data.css || ''}" title="${name}" alt="">`
            : name;
    }

    static formatDisplayValue (value, $container, selector = 'display-format') {
        for (const element of $container.find(`[data-${selector}]`)) {
            const result = this.getDisplayValue(value, $(element).data(selector));
            if (result) {
                element.innerHTML = result;
            }
        }
    }

    static getDisplayValue (value, format) {
        if (format?.name === 'mask') {
            return this.asMask(value, format.params);
        }
    }
};