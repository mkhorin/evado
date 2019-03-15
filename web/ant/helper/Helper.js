'use strict';

Ant.Helper = class {

    static confirm (message) {
        return !message || confirm(Ant.I18n.translate(message));
    }

    static parseJson (data) {
        try {
            return JSON.parse(data);
        } catch (err) {}
    }

    static resolveTemplate (text, data) {
        return text.replace(/\${(\w+)}/g, (match, val)=> data.hasOwnProperty(val) ? data[val] : '');
    }

    static renderSelectOptions (data) {
        let result = data.hasEmpty ? `<option value="">${data.emptyText || ''}</option>` : '';
        if (Array.isArray(data.items)) {
            for (let item of data.items) {
                let selected = data.defaultValue === item.value ? ' selected' : '';
                result += `<option value="${item.value}" ${selected}>${item.text}</option>`;
            }
        }
        return result;
    }

    static resetFormElement ($element) {
        $element.wrap('<form>').closest('form').get(0).reset();
        $element.unwrap();
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
        let index = items.indexOf(value);
        if (index !== -1) {
            items.splice(index, 1);
        }
        return items.length ? items.join(',') : '';
    }
};

Ant.ArrayHelper = class {

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

    static diff (items, excluded) {
        return items.filter(item => excluded.indexOf(item) === -1);
    }

    static flip (items) {
        let map = {};
        if (Array.isArray(items)) {
            for (let i = 0; i < items.length; ++i) {
                map[items[i]] = i;
            }
        }
        return map;
    }

    static getRandom (items) {
        return items.length ? items[Math.floor(Math.random() * items.length)] : null;
    }

    static index (key, items) {
        let map = {};
        if (Array.isArray(items)) {
            for (let item of items) {
                if (item) {
                    map[item[key]] = item;
                }
            }
        }
        return map;
    }

    static intersect (items, targets) {
        let result = [];
        for (let item of items) {
            for (let target of targets) {
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
        let maps = [];
        for (let item of items) {
            maps.push({
                [item[key]]: value !== undefined ? item[value] : item
            });
        }
        return maps;
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
            if (values.indexOf(items[i][key]) !== -1) {
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
            let j = Math.floor((i--) * Math.random());
            let temp = items[i];
            items[i] = items[j];
            items[j] = temp;
        }
        return items;
    }

    static unique (items) {
        return items.filter((item, index)=> items.indexOf(item) === index);
    }

    static uniqueByKey (key, items) {
        let map = {};
        for (let item of items) {
            if (!Object.prototype.hasOwnProperty.call(map, item[key])) {
                map[item[key]] = item;
            }
        }
        return Object.values(map);
    }

    static getByNestedValue (value, key, items) {
        return items && items[this.searchByNestedValue(value, key, items)];
    }

    static searchByNestedValue (value, key, items) {
        if (items instanceof Array) {
            for (let i = 0; i < items.length; ++i) {
                if (Ant.ObjectHelper.getNestedValue(key, items[i]) === value) {
                    return i;
                }
            }
        }
        return -1;
    }
};

Ant.ObjectHelper = class {

    static push (value, key, map) {
        if (map[key] instanceof Array) {
            map[key].push(value);
        } else {
            map[key] = [value];
        }
    }

    static getValues (object) {
        return object ? Object.values(object) : [];
    }

    static unsetKeys (object, keys) {
        for (let key of keys) {
            delete object[key];
        }
    }

    static getValueLabel (key, data) {
        return data && Object.prototype.hasOwnProperty.call(data, key) ? data[key] : key;
    }

    static assignUndefined (target, ...args) {
        for (let source of args) {
            if (source && typeof source === 'object') {
                for (let key of Object.keys(source)) {
                    if (!Object.prototype.hasOwnProperty.call(target, key)) {
                        target[key] = source[key];
                    }
                }
            }
        }
        return target;
    }

    static getNestedValue (key, data) {
        if (!data || typeof key !== 'string') {
            return undefined;
        }
        if (data.hasOwnProperty(key)) {
            return data[key];
        }
        let pos = key.indexOf('.');
        if (pos > 0) {
            let destKey = key.substring(0, pos);
            if (data.hasOwnProperty(destKey)) {
                key = key.substring(pos + 1);
                if (data[destKey]) {
                    return this.getNestedValue(key, data[destKey]);
                }
            }
        }
    }
};

Ant.StringHelper = class {

    static toFirstUpperCase (str) {
        return str.charAt(0).toUpperCase() + str.slice(1);
    }

    static toFirstLowerCase (str) {
        return str.charAt(0).toLowerCase() + str.slice(1);
    }

    static replaceParam (str, param, value) {
        let re = new RegExp(`{${param}}`, 'g');
        return str.replace(re, value);
    }
};

Ant.UrlHelper = class {

    static getNewPageUrl (modal) {
        return this.addUrlParams(location.href, {modal});
    }

    static openNewPage (url) {
        Object.assign(document.createElement('a'), {
            'target': '_blank',
            'href': url
        }).click();
    }

    static addUrlParams (url, data) {
        data = typeof data === 'string' ? data : $.param(data);
        return `${url}${url.indexOf('?') === -1 ? '?' : '&'}${data}`;
    }

    static getUrlParams (url) {
        let data = String(url).split('?');
        data = data[1] || data[0];
        data = data.split('&');
        let params = {};
        for (let item of data) {
            item = item.split('=');
            if (item.length === 2) {
                params[item[0]] = item[1];
            }
        }
        return params;
    }
};

Ant.FormatHelper = class {

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
        return `${size} ${unit}`;
    }
};

Ant.DateHelper = class {

    static stringify (date, absolute) {
        return (absolute ? moment(date).utcOffset(0, true) : moment.utc(date)).format();
    }

    static resolveClientDate ($container) {
        $container.find('time[data-format]').each((index, element)=> {
            let $element = $(element);
            let format = $element.attr('data-format');
            if (format) {
                let date = $element.attr('datetime');
                date = $element.data('utc') ? date.slice(0, -1) : date;
                $element.html(moment(date).format(format));
            }
            $element.removeAttr('data-format');
        });
    }

    static setTimeSelectAfterDay ($picker) {
    }
};