/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
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

    asInherited (value) {
        return `<span class="inherited-value" title="Inherited value">${this.format(value)}</span>`
    }

    asModalLink (value, params = {}) {
        return `<a href="${value}" class="modal-link">${params.text || value}</a>`;
    }

    asNoAccess (value, params = {}) {
        return this.translate(this.noAccessFormat, I18n.APP_SOURCE, params.language);
    }

    asPreview (value, params = {}) {
        return `<a href="${params.download}" class="download-link" target="_blank"><img src="${value}" alt="${params.text}"></a>`;
    }
};
module.exports.init();

const I18n = require('areto/i18n/I18n');
