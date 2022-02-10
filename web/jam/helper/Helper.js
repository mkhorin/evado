/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
Jam.Helper = class Helper {

    static bindLabelsToInputs ($container) {
        let index = 0;
        let base = this.random(1, Number.MAX_SAFE_INTEGER);
        let $inputs = $container.find('.form-check-input').add($container.find('.btn-check'));
        for (const input of $inputs) {
            input.id = input.id || base + index++;
            input.nextElementSibling.setAttribute('for', input.id);
        }
    }

    static confirm (message) {
        return !message || confirm(Jam.t(message));
    }

    static copyToClipboard (value, format = 'text/plain') {
        $(document).one('copy', event => {
            event.preventDefault();
            event.originalEvent.clipboardData.setData(format, value);
        });
        document.execCommand('copy');
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

    static fixMultipleBootstrapModals () {
        const $body = $(document.body).on('hidden.bs.modal', '.modal', () => {
            $body.toggleClass('modal-open', $body.children('.modal-backdrop').length > 0);
        });
    }

    static random (min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    static parseJson (data) {
        if (typeof data !== 'string') {
            return data;
        }
        try {
            return JSON.parse(data);
        } catch {}
    }

    static findAndResolveTemplate (id, $container, data) {
        return this.resolveTemplate(this.getTemplate(id, $container), data);
    }

    static getTemplate (id, $container) {
        return $container.find('template').filter(`[data-id="${id}"]`).html();
    }

    static resolveTemplate (text, data = {}) {
        return text.replace(/{{(\w+)}}/gm, (match, key) => data.hasOwnProperty(key) ? data[key] : '');
    }

    static renderSelectOptions (data) {
        const items = [];
        if (data.hasEmpty) {
            items.push({
                text: data.emptyText || '',
                value: data.emptyValue || ''
            });
        }
        items.push(...this.formatSelectItems(data.items));
        let result = '';
        for (let {text, value} of items) {
            const selected = value === data.defaultValue ? ' selected' : '';
            if (data.translate !== false) {
                text = Jam.t(text, data.translate);
            }
            result += `<option value="${value}" ${selected}>${text}</option>`;
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

    static getCookie (name) {
        const data = name.replace(/([\.$?*|{}\(\)\[\]\\\/\+^])/g, '\\$1');
        const matches = document.cookie.match(new RegExp(`(?:^|; )${data}=([^;]*)`));
        return matches ? decodeURIComponent(matches[1]) : undefined;
    }

    static setCookie(name, value, options = {}) {
        options = {
            path: '/',
            ...options
        };
        if (options.expires instanceof Date) {
            options.expires = options.expires.toUTCString();
        }
        let cookie = encodeURIComponent(name) +'='+ encodeURIComponent(value);
        for (const key of Object.keys(options)) {
            cookie += '; ' + key;
            if (options[key] !== true) {
                cookie += '=' + options[key];
            }
        }
        document.cookie = cookie;
    }

    static sortChildrenByInteger ($container, key = 'index') {
        $container.children().sort((a, b) => {
            return a.dataset.hasOwnProperty(key) && b.dataset.hasOwnProperty(key)
                ? parseInt(a.dataset[key]) - parseInt(b.dataset[key])
                : 0;
        }).appendTo($container);
    }

    static validateWithBrowser (form) {
        return !form.checkValidity || form.checkValidity();
    }

    static handlePreloadLinks ($container = $(document.body)) {
        $container.on('click', 'a[data-preload="true"]', event => {
            event.preventDefault();
            event.target.removeAttribute('data-preload');
            $.get(event.target.href).done(url => {
                event.target.href = url;
                event.target.click();
            });
        });
    }
};