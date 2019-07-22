/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

Jam.I18n = class {

    constructor () {
        this._data = this.constructor;
    }

    translate (message, category) {
        let result = this.getMessage(category, message);
        return result === undefined ? message : result;
    }

    translateContainer (container) {
        const $container = $(container);
        this.translateElements($container);
        this.translateAttributes($container);
    }

    translateElements ($container) {
        for (let element of $container.find('[data-t]')) {
            this.translateElement(element)
        }
    }

    translateElement (element) {
        let message = this.getMessage(element.dataset.t, element.innerHTML);
        if (message !== undefined) {
            element.innerHTML = message;
        }
    }

    translateAttributes ($container) {
        for (let name of this.getAttributes($container)) {
            let category = 't' + Jam.StringHelper.toFirstUpperCase(name);
            for (let element of $container.find(`[${name}]`)) {
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
        let message = this.getMessage(element.dataset[category], element.getAttribute(name));
        if (message !== undefined) {
            element.setAttribute(name, message);
        }
    }

    getMessage (category, message) {
        let map = category ? this._data[category] : this._data.default;
        if (map && map.hasOwnProperty(message)) {
            return map[message];
        }
        if (category) {
            let index = category.lastIndexOf('.');
            if (index !== -1) {
                return this.getMessage(category.substring(0, index), message);
            }
        }
    }
};