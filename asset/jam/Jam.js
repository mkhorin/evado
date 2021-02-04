/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

class Jam {

    static escape () {
        return this.StringHelper.escapeTags(...arguments);
    }

    static t () {
        return this.i18n.translate(...arguments);
    }

    static toggleLoader (state) {
        $(document.body).toggleClass('loading', state);
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

    static getClass (name) {
        if (typeof name !== 'string') {
            return name ? this.getClass(name.name) : null;
        }
        const pos = name.indexOf('.');
        if (pos === -1) {
            return this[name];
        }
        const item = this[name.substring(0, pos)];
        return item ? this.getClass.call(item, name.substring(pos + 1)) : null;
    }

    static createElements (container = document.body) {
        const instances = [];
        const elements = $(container).find('[data-jam]').get().reverse();
        for (const element of elements) {
            const name = element.dataset.jam;
            if (!name) {
                continue;
            }
            const Class = this.getClass(name);
            if (Class?.prototype instanceof Jam.Element) {
                instances.push(this[name].createInstance($(element)));
            } else {
                console.error(`Invalid Jam.Element: ${name}`);
            }
        }
        for (const instance of instances) {
            instance.init();
        }
    }
}