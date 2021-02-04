/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
Jam.Helper = class Helper {

    static confirm (message) {
        return !message || confirm(Jam.t(message));
    }

    static parseJson (data) {
        if (typeof data === 'string') {
            try {
                return JSON.parse(data);
            } catch {}
        }
        return data;
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
        let result = data.hasEmpty ? `<option value="">${data.emptyText || ''}</option>` : '';
        for (const item of this.formatSelectItems(data.items)) {
            const selected = data.defaultValue === item.value ? ' selected' : '';
            const text = data.translate !== false
                ? Jam.t(item.text, data.translate)
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

    static fixMultipleBootstrapModals () {
        const $body = $(document.body).on('hidden.bs.modal', '.modal', event => {
            $body.toggleClass('modal-open', $body.children('.modal-backdrop').length > 0);
        });
    }

    static scrollTo (target, duration = 300, done) {
        if (target instanceof jQuery) {
            if (!target.length) {
                return false;
            }
            target = target.offset().top;
        }
        const scrollTop = `${target}px`;
        $(document.documentElement).animate({scrollTop}, {duration}, done);
    }

    static bindLabelsToInputs ($container) {
        let base = this.getRandom(1, Number.MAX_SAFE_INTEGER);
        let index = 0;
        for (const input of $container.find('.form-check-input')) {
            input.id = input.id || base + index++;
            input.nextElementSibling.setAttribute('for', input.id);
        }
    }

    static validateWithBrowser (form) {
        return !form.checkValidity || form.checkValidity();
    }
};