/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const Base = require('areto/base/Base');

module.exports = class MessageTemplate extends Base {

    constructor (config) {
        super(config);
        this.data = this.data || {};
    }

    resolveHeader (text) {
        return this.resolveTemplate(text, this.data);
    }

    resolveContent (text) {
        return this.resolveTemplate(text, this.data);
    }

    resolveTemplate (text, data) {
        return typeof text === 'string'
            ? text.replace(/{{(\w+)}}/gm, (match, key)=> data.hasOwnProperty(key) ? data[key] : '')
            : this.wrapClassMessage('Text is not string');
    }
};
module.exports.init(module);