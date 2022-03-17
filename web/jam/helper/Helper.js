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