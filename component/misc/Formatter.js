/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const Base = require('areto/i18n/Formatter');

module.exports = class Formatter extends Base {

    constructor (config) {
        super({
            noAccessFormat: '<span class="no-access" data-t="">[no access]</span>',
            nullFormat: '<span class="not-set" data-t="">[not set]</span>',
            ...config
        });
    }

    format (value, type, params) {
        return type && typeof type === 'object'
            ? super.format(value, type.name, type.params || type)
            : super.format(value, type, params);
    }

    asDisplayFormat (value, params) {
        return value !== null && value !== undefined
            ? `<span data-display-format="${EscapeHelper.escapeHtml(JSON.stringify(params))}">${value}</span>`
            : this.nullFormat;
    }

    asDownload (value, params) {
        return `<a href="${value}" class="download-link" target="_blank">${params?.text || value}</a>`;
    }

    asInherited (value, params) {
        const translate = typeof params.translate === 'string' ? `data-t="${params.translate}"` : '';
        value = this.asRaw(value, params);
        return `<span class="inherited-value" ${translate} title="Inherited value" data-t-title="">${value}</span>`;
    }

    asFrameLink (value, params) {
        return `<a href="${value}" class="frame-link">${params?.text || value}</a>`;
    }

    asMask (value, params) {
        return this.asDisplayFormat(value, {name: 'mask', params});
    }

    asNoAccess (value, params) {
        return this.noAccessFormat;
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

const EscapeHelper = require('areto/helper/EscapeHelper');
const I18n = require('areto/i18n/I18n');
const moment = require('moment');