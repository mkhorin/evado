/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
Jam.I18n = class I18n {

    static DEFAULT_ATTRIBUTES = ['title', 'placeholder'];

    constructor () {
        this._data = this.constructor;
    }

    getLanguage () {
        return document.documentElement.lang;
    }

    translate (message) {
        return message instanceof jQuery
            ? this.translateContainer(...arguments)
            : typeof message === 'boolean'
                ? this.translateBoolean(...arguments)
                : this.translateMessage(...arguments);
    }

    translateBoolean (value, category) {
        return this.translateMessage(value ? 'Yes' : 'No', category);
    }

    translateMessage (message, category) {
        const result = this.getMessage(category, message);
        return result === undefined ? message : result;
    }

    translateDocument () {
        this.translateDocumentTitle();
        this.translateContainer($(document.body));
    }

    translateDocumentTitle () {
        const title = document.head.querySelector('title');
        const data = title.dataset;
        if (!data.hasOwnProperty('t')) {
            return;
        }
        const category = data.t;
        const text = this.translateMessage(title.innerHTML, category);
        if (data.text) {
            const prefix = this.translateMessage(data.text, category);
            title.innerHTML = `${prefix} - ${text}`;
        } else {
            title.innerHTML = text;
        }
    }

    translateContainer ($container) {
        this.translateElements($container);
        this.translateAttributes($container);
    }

    translateElements ($container) {
        const elements = $container.find('[data-t]');
        for (const element of elements) {
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
        const names = this.getAttributes($container);
        for (const name of names) {
            const category = 't' + Jam.StringHelper.capitalize(name);
            const elements = $container.find(`[${name}]`);
            for (const element of elements) {
                this.translateAttribute(name, category, element);
            }
        }
    }

    getAttributes ($container) {
        const names = $container.data('tAttrs');
        if (names === undefined) {
            return this.constructor.DEFAULT_ATTRIBUTES;
        }
        if (names && typeof names === 'string') {
            return names.split(',');
        }
        return [];
    }

    translateAttribute (name, category, element) {
        category = element.dataset[category] ?? element.dataset.t;
        const value = element.getAttribute(name);
        const message = this.getMessage(category, value);
        if (message !== undefined) {
            element.setAttribute(name, message);
        }
    }

    getMessage (category, message) {
        return Array.isArray(message)
            ? this.getFormattedMessage(category, ...message)
            : this.getRegularMessage(category, message);
    }

    getFormattedMessage (category, message, params) {
        let text = this.getRegularMessage(category, message);
        if (text === undefined) {
            text = message;
        }
        if (params) {
            for (const key of Object.keys(params)) {
                const regex = new RegExp(`{${key}}`, 'g');
                text = text.replace(regex, params[key]);
            }
        }
        return text;
    }

    getRegularMessage (category, message) {
        const key = category || 'defaults';
        const data = this._data[key];
        if (Jam.ObjectHelper.has(message, data)) {
            return data[message];
        }
        if (category) {
            const index = category.lastIndexOf('.');
            if (index !== -1) {
                const parent = category.substring(0, index);
                return this.getMessage(parent, message);
            }
        }
    }
};