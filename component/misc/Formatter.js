'use strict';

const Base = require('areto/i18n/Formatter');

module.exports = class Formatter extends Base {

    constructor (config) {
        super({
            noAccessFormat: '<span class="no-access">[no access]</span>',
            ...config
        });
    }

    asDownload (value, params = {}) {
        return `<a href="${value}" class="download-link" target="_blank">${params.text || value}</a>`;
    }

    asInherited (value, params = {}) {
        return `<span class="inherited-value" title="Inherited value">${this.format(value)}</span>`
    }

    asNoAccess (value, params = {}) {
        return this.translate(this.noAccessFormat, I18n.APP_CATEGORY, params.language);
    }

    asPreview (value, params = {}) {
        return `<a href="${params.download}" class="download-link" target="_blank"><img src="${value}" alt="${params.text}"></a>`;
    }
};
module.exports.init();

const I18n = require('areto/i18n/I18n');
