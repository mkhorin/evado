'use strict';

const Base = require('areto/i18n/Formatter');

module.exports = class Formatter extends Base {

    constructor (config) {
        super({
            'noAccessFormat': '<span class="no-access">[no access]</span>',
            ...config
        });
    }

    asNoAccess (value, params = {}) {
        return this.translate(this.noAccessFormat, I18n.APP_CATEGORY, params.language);
    }

    asInherited (value, params = {}) {
        return `<span class="inherited-value" title="Inherited value">${this.format(value, 'raw')}</span>`
    }
};
module.exports.init();

const I18n = require('areto/i18n/I18n');
