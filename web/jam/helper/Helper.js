/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
Jam.Helper = class Helper {

    static bindLabelsToInputs ($container) {
        let index = 0;
        let base = this.random(1, Number.MAX_SAFE_INTEGER);
        let $check = $container.find('.btn-check');
        let $inputs = $container.find('.form-check-input').add($check);
        for (const input of $inputs) {
            input.id = input.id || base + index++;
            $(input).next().find('label').addBack().filter('label').attr('for', input.id);
        }
    }

    static getLabelTextByValue (value, $container) {
        const id = $container.find(`[value="${value}"]`).attr('id');
        return $container.find(`[for="${id}"]`).text();
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
        const source = $images.first().data('src');
        $images.first().prop('src', source);
    }

    static fixMultipleBootstrapModals () {
        const $body = $(document.body);
        $body.on('hidden.bs.modal', '.modal', () => {
            const $backdrops = $body.children('.modal-backdrop');
            $body.toggleClass('modal-open', $backdrops.length > 0);
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
        const content = this.getTemplate(id, $container);
        return this.resolveTemplate(content, data);
    }

    static getTemplate (id, $container) {
        if (!$container) {
            $container = $(document.body);
        }
        return $container.find('template').filter(`[data-id="${id}"]`).html();
    }

    static resolveTemplate (content, data = {}) {
        return content.replace(/{{(\w+)}}/gm, (match, key) => {
            return Object.hasOwn(data, key) ? data[key] : '';
        });
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
        return items.join();
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
        const compare = (a, b) => {
            if (Object.hasOwn(a.dataset, key)) {
                if (Object.hasOwn(b.dataset, key)) {
                    return parseInt(a.dataset[key]) - parseInt(b.dataset[key]);
                }
            }
            return 0;
        };
        $container.children().sort(compare).appendTo($container);
    }

    static validateWithBrowser (form) {
        return !form.checkValidity || form.checkValidity();
    }

    static handlePreloadLinks ($container = $(document.body)) {
        $container.on('click', 'a[data-preload="true"]', event => {
            event.preventDefault();
            const {target} = event;
            target.removeAttribute('data-preload');
            $.get(target.href).done(url => {
                target.href = url;
                target.click();
            });
        });
    }
};