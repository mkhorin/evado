/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

Jam.Helper = class Helper {

    static confirm (message) {
        return !message || confirm(Jam.i18n.translate(message));
    }

    static parseJson (data) {
        if (typeof data === 'string') {
            try {
                return JSON.parse(data);
            } catch {}
        }
        return data;
    }

    static getTemplate (id, $container) {
        return $container.find('template').filter(`[data-id="${id}"]`).html();
    }

    static resolveTemplate (text, data = {}) {
        return text.replace(/{{(\w+)}}/gm, (match, key) => data.hasOwnProperty(key) ? data[key] : '');
    }

    static renderSelectOptions (data) {
        let result = data.hasEmpty ? `<option value="">${data.emptyText || ''}</option>` : '';
        for (const item of this.formatSelectItems(data.items)) {
            const selected = data.defaultValue === item.value ? ' selected' : '';
            const text = data.translate !== false
                ? Jam.i18n.translate(item.text, data.translate)
                : item.text;
            result += `<option value="${item.value}" ${selected}>${text}</option>`;
        }
        return result;
    }

    static formatSelectItems (items) {
        if (!Array.isArray(items)) {
            items = items ? Object.keys(items).map(value => ({value, text: items[value]})) : [];
        }
        for (let item of items) {
            item.id = item.value; // for select2
        }
        return items;
    }

    static resetFormElement ($element) {
        $element.wrap('<form>').closest('form').get(0).reset();
        $element.unwrap();
    }

    static clearTags (text) {
        return typeof text === 'string' ? text.replace(/(<([^>]+)>)/ig, '') : text;
    }

    static escapeTags (text) {
        return typeof text === 'string' ? text.replace(/</g, '&lt;').replace(/>/g, '&gt;') : text;
    }

    static escapeHtml (text) {
        if (typeof text !== 'string') {
            return text;
        }
        return text.replace(/&(?!#?[a-zA-Z0-9]+;)/g, '&amp;')
            .replace(/</g, '&lt;').replace(/>/g, '&gt;')
            .replace(/'/g, '&#39;').replace(/"/g, '&quot;');
    }

    static copyToClipboard (value, format = 'text/plain') {
        $(document).one('copy', event => {
            event.preventDefault();
            event.originalEvent.clipboardData.setData(format, value);
        });
        document.execCommand('copy');
    }

    static hasDocumentScroll () {
        return $(document).height() > $(window).height();
    }

    static addCommaValue (value, items) {
        if (typeof items !== 'string' || !items.length) {
            return value;
        }
        items = items.split(',');
        items.push(value);
        return items.join(',');
    }

    static removeCommaValue (value, items) {
        if (typeof items !== 'string' || !items.length) {
            return items;
        }
        items = items.split(',');
        const index = items.indexOf(value);
        if (index !== -1) {
            items.splice(index, 1);
        }
        return items.length ? items.join(',') : '';
    }

    static promise (callback) {
        return new Promise((resolve, reject) => {
            callback((err, result) => err ? reject(err) : resolve(result));
        });
    }

    static addDeferred (spawn, deferred) {
        return deferred ? deferred.then(spawn) : spawn();
    }

    static post (url, data) {
        return $.post(url, this.addCsrfToken(data));
    }

    static addCsrfToken (data) {
        const csrf = this.getCsrfToken();
        return typeof data === 'string' ? `csrf=${csrf}&${data}` : {csrf, ...data};
    }

    static getCsrfToken () {
        return $(document.body).data('csrf');
    }

    static createSerialImageLoading ($container = $(document.body)) {
        $container.find('img').each((index, image) => {
            if (!image.getAttribute('data-src')) {
                image.setAttribute('data-src', image.getAttribute('src'));
                image.removeAttribute('src');
            }
        });
    }

    static executeSerialImageLoading ($container = $(document.body)) {
        const $images = $container.find('img').filter('[data-src]');
        $images.slice(0, -1).each((index, image) => {
            const processNext = () => {
                const $next = $images.eq(index + 1);
                $next.prop('src', $next.data('src'));
            };
            image.addEventListener('load', processNext);
            image.addEventListener('error', processNext);
        });
        $images.first().prop('src', $images.first().data('src'));
    }

    static sortChildrenByInteger ($container, key = 'index') {
        $container.children().sort((a, b) => {
            return a.dataset.hasOwnProperty(key) && b.dataset.hasOwnProperty(key)
                ? parseInt(a.dataset[key]) - parseInt(b.dataset[key])
                : 0;
        }).appendTo($container);
    }

    static getRandom (min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }
};

Jam.ArrayHelper = class ArrayHelper {

    static equals (a, b) {
        if (!Array.isArray(a) || !Array.isArray(b) || a.length !== b.length) {
            return false;
        }
        for (let i = 0; i < a.length; ++i) {
            if (a[i] !== b[i]) {
                return false;
            }
        }
        return true;
    }

    static exclude (targets, sources) {
        return sources.filter(item => !targets.includes(item));
    }

    static flip (items) {
        const data = {};
        if (Array.isArray(items)) {
            for (let i = 0; i < items.length; ++i) {
                data[items[i]] = i;
            }
        }
        return data;
    }

    static getRandom (items) {
        return items.length ? items[Math.floor(Math.random() * items.length)] : null;
    }

    static index (key, items) {
        const data = {};
        if (Array.isArray(items)) {
            for (const item of items) {
                if (item) {
                    data[item[key]] = item;
                }
            }
        }
        return data;
    }

    static indexArrays (key, items) {
        const data = {};
        if (Array.isArray(items)) {
            for (const item of items) {
                if (item) {
                    if (Array.isArray(data[item[key]])) {
                        data[item[key]].push(item);
                    } else {
                        data[item[key]] = [item];
                    }
                }
            }
        }
        return data;
    }

    static intersect (items, targets) {
        const result = [];
        for (const item of items) {
            for (const target of targets) {
                if (item === target) {
                    result.push(item);
                    break;
                }
            }
        }
        return result;
    }

    // get [ { key: value }, ... ] from object array
    static mapValueByKey (key, items, value) {
        const values = [];
        for (const item of items) {
            values.push({[item[key]]: value !== undefined ? item[value] : item});
        }
        return values;
    }

    static remove (value, values) {
        value = values.indexOf(value);
        if (value === -1) {
            return false;
        }
        values.splice(value, 1);
        return true;
    }

    static removeObjectsByKeyValues (key, values, items) {
        for (let i = items.length - 1; i >= 0; --i) {
            if (values.includes(items[i][key])) {
                items.splice(i, 1);
            }
        }
    }

    static replaceObjectByTarget (target, key, items) {
        for (let i = 0; i < items.length; ++i) {
            if (items[i][key] === target[key]) {
                items.splice(i, 1, target);
                return;
            }
        }
    }

    static shuffle (items) {
        let i = items.length;
        while (i) {
            const j = Math.floor((i--) * Math.random());
            const temp = items[i];
            items[i] = items[j];
            items[j] = temp;
        }
        return items;
    }

    static unique (items) {
        return items.filter((item, index) => items.indexOf(item) === index);
    }

    static uniqueByKey (key, items) {
        const data = {}, result = [];
        for (const item of items) {
            if (!Object.prototype.hasOwnProperty.call(data, item[key])) {
                data[item[key]] = item;
                result.push(item);
            }
        }
        return result;
    }

    static getByNestedValue (value, key, items) {
        return items && items[this.searchByNestedValue(value, key, items)];
    }

    static searchByNestedValue (value, key, items) {
        if (Array.isArray(items)) {
            for (let index = 0; index < items.length; ++index) {
                if (Jam.ObjectHelper.getNestedValue(key, items[index]) === value) {
                    return index;
                }
            }
        }
        return -1;
    }
};

Jam.ClassHelper = class ClassHelper {

    static normalizeSpawn (config, BaseClass, container) {
        if (!config) {
            return null;
        }
        let spawn = Jam.Helper.parseJson(config) || {};
        if (typeof spawn === 'string') {
            spawn = {Class: spawn};
        }
        if (typeof spawn.Class === 'string') {
            spawn.Class = container ? container[spawn.Class] : Jam[spawn.Class];
        }
        if (typeof spawn.Class !== 'function') {
            return console.error(`Invalid spawn class: ${config}`);
        }
        if (BaseClass && !(spawn.Class.prototype instanceof BaseClass)) {
            return console.error(`Class does not extend base class: ${config}`);
        }
        return spawn;
    }

    static spawn (config, params) {
        config = this.normalizeSpawn(config);
        return config ? new config.Class(Object.assign(config, params)) : null;
    }

    static spawnInstances (items, params) {
        const result = [];
        items = Array.isArray(items) ? items : [];
        for (let item of items) {
            item = this.spawn(item, params);
            if (item) {
                result.push(item);
            }
        }
        return result;
    }
};

Jam.DateHelper = class DateHelper {

    static isValid (date) {
        if (!date) {
            return false;
        }
        date = date instanceof Date ? date : new Date(date);
        return !isNaN(date.getTime());
    }

    static stringify (date, absolute) {
        return (absolute ? moment(date).utcOffset(0, true) : moment.utc(date)).format();
    }

    static formatByUtc (isoDate, utc) {
        return utc ? isoDate.slice(0, -1) : isoDate; // delete Z suffix
    }

    static resolveClientDate ($container) {
        for (const item of $container.find('time[data-format]')) {
            const $item = $(item);
            const format = $item.attr('data-format');
            if (format) {
                const date = this.formatByUtc($item.attr('datetime'), $item.data('utc'));
                $item.html(moment(date).format(this.getMomentFormat(format)));
            }
            $item.removeAttr('data-format');
        }
    }

    static getMomentFormat (format) {
        switch (format) {
            case 'date': return 'L';
            case 'datetime': return 'L LTS';
            case 'timestamp': return 'L LTS';
        }
        return format;
    }

    static setTimeSelectAfterDay () {
    }
};

Jam.FormatHelper = class FormatHelper {

    static asBoolean (data) {
        const num = Number(data);
        return isNaN(num) ? data : Jam.i18n.translate(num === 0 ? 'No' : 'Yes');
    }
    
    static asBytes (size) {
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
        return `${size} ${Jam.i18n.translate(unit)}`;
    }

    static asDate (data, format = 'L') {
        const date = moment(data);
        return !data ? '' : date.isValid() ? date.format(format) : data;
    }
    
    static asDatetime (data, format = 'L LTS') {
        return this.asDate(data, format);
    }

    static asInvalidData () {
        return `<span class="not-set">[${Jam.i18n.translate('invalid data')}]</span>`;
    }

    static asNoAccess () {
        return `<span class="no-access">[${Jam.i18n.translate('no access')}]</span>`;
    }

    static asNotSet () {
        return `<span class="not-set">[${Jam.i18n.translate('not set')}]</span>`;
    }

    static asSpinner () {
        return `<span class="fa fa-spinner fa-spin"></span>`;
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
        const name = Jam.Helper.escapeTags(data.name);
        if (data.thumbnail) {
            const css = `img-responsive thumbnail ${data.css}`;
            return `<img src="${data.thumbnail}" class="${css}" title="${name}" alt="">`;
        }
        return name;
    }
};

Jam.ObjectHelper = class ObjectHelper {

    static has (key, data) {
        return data && Object.prototype.hasOwnProperty.call(data, key);
    }

    static push (value, key, data) {
        if (Array.isArray(data[key])) {
            data[key].push(value);
        } else {
            data[key] = [value];
        }
    }

    static getValues (object) {
        return object ? Object.values(object) : [];
    }

    static unsetKeys (object, keys) {
        for (const key of keys) {
            delete object[key];
        }
    }

    static getValueLabel (key, data) {
        return this.has(key, data) ? data[key] : key;
    }

    static assignUndefined (target, ...args) {
        for (const source of args) {
            if (source && typeof source === 'object') {
                for (const key of Object.keys(source)) {
                    if (!this.has(key, target)) {
                        target[key] = source[key];
                    }
                }
            }
        }
        return target;
    }

    static getNestedValue (key, data, defaults) {
        if (!data || typeof key !== 'string') {
            return defaults;
        }
        if (Object.prototype.hasOwnProperty.call(data, key)) {
            return data[key];
        }
        const pos = key.indexOf('.');
        if (pos > 0) {
            const targetKey = key.substring(0, pos);
            if (this.has(targetKey, data)) {
                key = key.substring(pos + 1);
                if (data[targetKey]) {
                    return this.getNestedValue(key, data[targetKey], defaults);
                }
            }
        }
        return defaults;
    }
};

Jam.StringHelper = class StringHelper {

    static toFirstUpperCase (str) {
        return str.charAt(0).toUpperCase() + str.slice(1);
    }

    static toFirstLowerCase (str) {
        return str.charAt(0).toLowerCase() + str.slice(1);
    }

    static replaceParam (str, param, value) {
        const regex = new RegExp(`{${param}}`, 'g');
        return str.replace(regex, value);
    }
};

Jam.UrlHelper = class UrlHelper {

    static getPageModalUrl (modal, base) {
        return this.getPageUrl({modal}, base);
    }

    static openNewPageModal () {
        this.openNewPage(this.getPageModalUrl(...arguments));
    }

    static getPageUrl (data, base = location.href) {
        return this.addParams(base, data);
    }

    static openNewPage (url, data) {
        setTimeout(() => window.open(this.addParams(url, data), '_blank'), 0);
    }

    static addParams (url, data) {
        if (typeof data === 'string') {
            return data ? `${url}${url.includes('?') ? '&' : '?'}${data}` : url;
        }
        data = Object.assign(this.getParams(url), data);
        return `${this.getPath(url)}?${$.param(data)}`;
    }

    static getParams (url) {
        let data = String(url).split('?');
        data = data[1] || data[0];
        data = data.split('&');
        const params = {};
        for (let item of data) {
            item = item.split('=');
            if (item.length === 2) {
                params[item[0]] = decodeURIComponent(item[1]);
            }
        }
        return params;
    }

    static getPath (url) {
        const index = url.indexOf('?');
        return index === -1 ? url : url.substring(0, index);
    }
};

Jam.AsyncHelper = class AsyncHelper {

    static each (items, handler, callback) {
        if (!Array.isArray(items) || !items.length) {
            return callback();
        }
        (new this({items, handler, callback, counter: 0})).each();
    }

    static series (items, callback) {
        const result = Array.isArray(items) ? [] : {};
        if (!items) {
            return callback(null, result);
        }
        const keys = Object.keys(items);
        if (!keys.length) {
            return callback(null, result);
        }
        (new this({items, callback, keys, result})).series();
    }

    static eachSeries (items, handler, callback) {
        if (!Array.isArray(items) || !items.length) {
            return callback();
        }
        (new this({items, handler, callback})).eachSeries();
    }

    static eachOfSeries (items, handler, callback) {
        if (!items) {
            return callback();
        }
        const keys = Object.keys(items);
        if (!keys.length) {
            return callback();
        }
        (new this({items, handler, callback, keys})).eachOfSeries();
    }

    static mapSeries (items, handler, callback) {
        const result = [];
        if (!Array.isArray(items) || !items.length) {
            return callback(null, result);
        }
        (new this({items, handler, callback, result})).mapSeries();
    }

    constructor (config) {
        Object.assign(this, config);
    }

    each () {
        const process = err => {
            if (err || ++this.counter === this.items.length) {
                this.callback(err);
            }
        };
        for (const item of this.items) {
            this.handler(item, process);
        }
    }

    series (pos = 0) {
        this.items[this.keys[pos]]((err, value) => {
            if (err) {
                return this.callback(err);
            }
            this.result[this.keys[pos]] = value;
            if (++pos === this.keys.length) {
                return this.callback(null, this.result);
            }
            this.series(pos);
        });
    }

    eachSeries (pos = 0) {
        this.handler(this.items[pos], err => {
            if (err) {
                return this.callback(err);
            }
            if (++pos === this.items.length) {
                return this.callback();
            }
            this.eachSeries(pos);
        });
    }

    eachOfSeries (pos = 0) {
        this.handler(this.items[this.keys[pos]], this.keys[pos], err => {
            if (err) {
                return this.callback(err);
            }
            if (++pos === this.keys.length) {
                return this.callback();
            }
            this.eachOfSeries(pos);
        });
    }

    mapSeries (pos = 0) {
        this.handler(this.items[pos], (err, value) => {
            if (err) {
                return this.callback(err);
            }
            this.result.push(value);
            if (++pos === this.items.length) {
                return this.callback(null, this.result);
            }
            this.mapSeries(pos);
        });
    }
};