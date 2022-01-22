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

    asDownload (value, params) {
        return `<a href="${value}" class="download-link" target="_blank">${params?.text || value}</a>`;
    }

    asInherited (value, params) {
        const translate = typeof params.translate === 'string' ? `data-t="${params.translate}"` : '';
        value = this.format(value, null, params);
        return `<span class="inherited-value" ${translate} title="Inherited value" data-t-title="">${value}</span>`;
    }

    asFrameLink (value, params) {
        return `<a href="${value}" class="frame-link">${params?.text || value}</a>`;
    }

    asNoAccess (value, params) {
        return this.translate(this.noAccessFormat, I18n.APP_SOURCE, params?.language);
    }

    asThumbnail (value, {text} = {}) {
        return `<img src="${value}" title="${text}" alt="${text}" loading="lazy">`;
    }

    asThumbnailDownload (value, {download, text} = {}) {
        value = `<img src="${value}" alt="${text}" loading="lazy">`;
        return `<a href="${download}" class="download-link" title="${text}" target="_blank">${value}</a>`;
    }

    asTimeFromInteger (value, params) {
        return Number.isSafeInteger(value)
            ? this.asTime(moment().startOf('day').add(moment.duration({s: value})), params)
            : value;
    }

    asTranslatable (value, params) {
        return `<span data-t="${params?.category || ''}">${value}</span>`;
    }
};
module.exports.init();

const I18n = require('areto/i18n/I18n');
const moment = require('moment');