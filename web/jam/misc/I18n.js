/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
Jam.I18n = class I18n {

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
        if (!title.dataset.hasOwnProperty('t')) {
            return;
        }
        const category = title.dataset.t;
        const text = this.translateMessage(title.innerHTML, category);
        title.innerHTML = title.dataset.text
            ? `${this.translateMessage(title.dataset.text, category)} - ${text}`
            : text;
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
            const category = 't' + Jam.StringHelper.capitalize(name);
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
        return Array.isArray(message)
            ? this.getFormattedMessage(category, ...message)
            : this.getRegularMessage(category, message);
    }

    getFormattedMessage (category, message, params = {}) {
        let text = this.getRegularMessage(category, message);
        if (text === undefined) {
            text = message;
        }
        for (const key of Object.keys(params)) {
            text = text.replace(new RegExp(`{${key}}`,'g'), params[key]);
        }
        return text;
    }

    getRegularMessage (category, message) {
        const data = category ? this._data[category] : this._data.defaults;
        if (Jam.ObjectHelper.has(message, data)) {
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