/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const Base = require('areto/base/Base');

module.exports = class MessageTemplate extends Base {

    prepareData (data) {
       return data;
    }

    resolveSubject (text) {
        return this.resolveTemplate(text, this.data);
    }

    resolveText (text) {
        return this.resolveTemplate(text, this.data);
    }

    resolveTemplate (text, data) {
        return typeof text === 'string'
            ? text.replace(/{([.\w]+)}/gm, this.resolveValue.bind(this, data))
            : this.wrapClassMessage('Text is not string');
    }

    resolveValue (data, match, key) {
        if (!data) {
            return '';
        }
        const items = key.split('.');
        for (let i = 0; i < items.length; ++i) {
            const item = items[i];
            if (typeof data[item] === 'function') {
                return data[item](...items.slice(i + 1));
            }
            data = data[item];
            if (data === null || data === undefined) {
                return '';
            }
        }
        return data;
    }
};