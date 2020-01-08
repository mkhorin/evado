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
        if (Array.isArray(items)) {
            return items;
        }
        return items ? Object.keys(items).map(value => ({value, text: items[value]})) : [];
    }

    static resetFormElement ($element) {
        $element.wrap('<form>').closest('form').get(0).reset();
        $element.unwrap();
    }

    static clearHtml (html) {
        return String(html).replace(/(<([^>]+)>)/ig, '');
    }

    static escapeHtml (html) {
        return String(html).replace(/&(?!#?[a-zA-Z0-9]+;)/g, '&amp;')
            .replace(/</g, '&lt;').replace(/>/g, '&gt;')
            .replace(/'/g, '&#39;').replace(/"/g, '&quot;');
    }

    static copyToClipboard (value, format) {
        $(document).one('copy', event => {
            event.preventDefault();
            event.originalEvent.clipboardData.setData(format || 'text/plain', value);
        });
        document.execCommand('copy');
    }

    static hasDocumentScroll () {
        return $(document).height() > $(window).height();
    }
/*
    static scrollToTop (top, duration, complete) {
        top = (top || 0) - $("header.main-header").outerHeight() + 30;
        $('html, body').animate({scrollTop: top}, {duration}, complete);
    }
*/
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

    static post ($element, url, data) {
        const csrf = $element.closest('[data-csrf]').data('csrf');
        data = typeof data === 'string' ? `csrf=${csrf}&${data}` : {csrf, ...data};
        return $.post(url, data);
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
            image.addEventListener('load', ()=> {
                const $next = $images.eq(index + 1);
                $next.prop('src', $next.data('src'));
            });
        });
        $images.first().prop('src', $images.first().data('src'));
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

    static removeValue (value, items) {
        value = items.indexOf(value);
        if (value === -1) {
            return false;
        }
        items.splice(value, 1);
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
        const data = {};
        for (const item of items) {
            if (!Object.prototype.hasOwnProperty.call(data, item[key])) {
                data[item[key]] = item;
            }
        }
        return Object.values(data);
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
            const format = this.getMomentFormat($item.attr('data-format'));
            if (format) {
                const date = this.formatByUtc($item.attr('datetime'), $item.data('utc'));
                $item.html(moment(date).format(format));
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
        return Jam.i18n.translate(Number(data) === 0 ? 'No' : 'Yes');
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
        size = Math.round(size * 100) / 100;
        return `${size} ${Jam.i18n.translate(unit)}`;
    }

    static asDate (data, format = 'L') {
        const date = moment(data);
        return !data ? '' : date.isValid() ? date.format(format) : data;
    }
    
    static asDatetime (data, format = 'L LTS') {
        return this.asDate(data, format);
    }

    static asTimestamp (data) {
        return this.asDatetime(data);
    }

    static asPreview (data) {
        return data ? `<img src="${data}" class="thumbnail" alt="">` : ''
    }
};

Jam.ObjectHelper = class ObjectHelper {

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
        return data && Object.prototype.hasOwnProperty.call(data, key) ? data[key] : key;
    }

    static assignUndefined (target, ...args) {
        for (const source of args) {
            if (source && typeof source === 'object') {
                for (const key of Object.keys(source)) {
                    if (!Object.prototype.hasOwnProperty.call(target, key)) {
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
            if (Object.prototype.hasOwnProperty.call(data, targetKey)) {
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

    static getNewPageUrl (modal) {
        return this.addUrlParams(location.href, {modal});
    }

    static openNewPageModal (url) {
        this.openNewPage(this.getNewPageUrl(url));
    }

    static openNewPage (url, data) {
        Object.assign(document.createElement('a'), {
            target: '_blank',
            href: this.addUrlParams(url, data)
        }).click();
    }

    static addUrlParams (url, data) {
        data = typeof data === 'string' ? data : $.param(data);
        return  data ? `${url}${url.includes('?') ? '&' : '?'}${data}` : url;
    }

    static getUrlParams (url) {
        let data = String(url).split('?');
        data = data[1] || data[0];
        data = data.split('&');
        const params = {};
        for (let item of data) {
            item = item.split('=');
            if (item.length === 2) {
                params[item[0]] = item[1];
            }
        }
        return params;
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