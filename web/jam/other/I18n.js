/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

Jam.I18n = class I18n {

    constructor () {
        this._data = this.constructor;
    }

    translate (message, category) {
        const result = this.getMessage(category, message);
        return result === undefined ? message : result;
    }

    translateDocument () {
        this.translateDocumentTitle();
        this.translateContainer($(document.body));
    }

    translateDocumentTitle () {
        const title = document.head.querySelector('title');
        if (title.dataset.text) {
            const text = this.translate(title.dataset.text, title.dataset.t);
            title.innerHTML = `${text} - ${title.innerHTML}`;
        }
    }

    translateContainer ($container) {
        this.translateElements($container);
        this.translateAttributes($container);
    }

    translateElements ($container) {
        for (const element of $container.find('[data-t]')) {
            this.translateElement(element)
        }
    }

    translateElement (element) {
        const message = this.getMessage(element.dataset.t, element.innerHTML);
        if (message !== undefined) {
            element.innerHTML = message;
        }
    }

    translateAttributes ($container) {
        for (const name of this.getAttributes($container)) {
            const category = 't' + Jam.StringHelper.toFirstUpperCase(name);
            for (const element of $container.find(`[${name}]`)) {
                this.translateAttribute(name, category, element);
            }
        }
    }

    getAttributes ($container) {
        let names = $container.data('tAttributes');
        names = typeof names !== 'string' ? names : names ? names.split(',') : [];
        if (!this._attributes) {
            this._attributes = names || ['title', 'placeholder'];
        }
        return names || this._attributes;
    }

    translateAttribute (name, category, element) {
        category = element.dataset[category] || element.dataset.t;
        const message = this.getMessage(category, element.getAttribute(name));
        if (message !== undefined) {
            element.setAttribute(name, message);
        }
    }

    getMessage (category, message) {
        const data = category ? this._data[category] : this._data.defaults;
        if (data && data.hasOwnProperty(message)) {
            return data[message];
        }
        if (category) {
            const index = category.lastIndexOf('.');
            if (index !== -1) {
                return this.getMessage(category.substring(0, index), message);
            }
        }
    }
};