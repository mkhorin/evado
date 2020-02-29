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

    asDownload (value, {text} = {}) {
        return `<a href="${value}" class="download-link" target="_blank">${text || value}</a>`;
    }

    asInherited (value, {translate} = {}) {
        translate = typeof translate === 'string' ? `data-t="${translate}"` : '';
        return `<span class="inherited-value" ${translate} title="Inherited value">${this.format(value)}</span>`
    }

    asModalLink (value, {text} = {}) {
        return `<a href="${value}" class="modal-link">${text || value}</a>`;
    }

    asNoAccess (value, {language} = {}) {
        return this.translate(this.noAccessFormat, I18n.APP_SOURCE, language);
    }

    asThumbnail (value, {text} = {}) {
        return `<img src="${value}" title="${text}" alt="${text}" loading="lazy">`;
    }

    asThumbnailDownload (value, {download, text} = {}) {
        value = `<img src="${value}" alt="${text}" loading="lazy">`;
        return `<a href="${download}" class="download-link" title="${text}" target="_blank">${value}</a>`;
    }

    asTimeFromInteger (value, params) {
        return Number.isInteger(value)
            ? this.asTime(moment().startOf('day').add(moment.duration({s: value})), params)
            : value;
    }

    asTranslatable (value, category = '') {
        return `<span data-t="${category}">${value}</span>`;
    }
};
module.exports.init();

const moment = require('moment');
const I18n = require('areto/i18n/I18n');