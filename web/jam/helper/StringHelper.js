/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
Jam.StringHelper = class StringHelper {

    static AZ_REGEX = /([A-Z]+)/g;
    static DASH_REGEX = /^-/;
    static HTML_REGEX = /&(?!#?[a-zA-Z0-9]+;)/g;
    static TAGS_REGEX = /(<([^>]+)>)/ig;
    static TAG_START_REGEX = /</g;
    static TAG_END_REGEX = />/g;
    static SINGLE_QUOTE_REGEX = /'/g;
    static DOUBLE_QUOTE_REGEX = /"/g;

    static clearTags (text) {
        if (typeof text !== 'string') {
            return this.toString(text);
        }
        return text.replace(this.TAGS_REGEX, '');
    }

    static escapeHtml (text) {
        if (typeof text !== 'string') {
            return this.toString(text);
        }
        text = text.replace(this.HTML_REGEX, '&amp;');
        return this.escapeQuotes(this.escapeTags(text));
    }

    static escapeTags (text) {
        if (typeof text !== 'string') {
            return this.toString(text);
        }
        return text
            .replace(this.TAG_START_REGEX, '&lt;')
            .replace(this.TAG_END_REGEX, '&gt;');
    }

    static escapeQuotes (text) {
        if (typeof text !== 'string') {
            return this.toString(text);
        }
        return text
            .replace(this.SINGLE_QUOTE_REGEX, '&#39;')
            .replace(this.DOUBLE_QUOTE_REGEX, '&quot;');
    }

    static camelToKebab (text) {
        if (typeof text !== 'string') {
            return this.toString(text);
        }
        return text
            .replace(this.AZ_REGEX, '-$1')
            .replace(this.DASH_REGEX, '')
            .toLowerCase();
    }

    static capitalize (text) {
        return text[0].toUpperCase() + text.slice(1);
    }

    static toLowerCaseFirstLetter (text) {
        return text[0].toLowerCase() + text.slice(1);
    }

    static replaceParam (text, param, value) {
        const regex = new RegExp(`{${param}}`, 'g');
        return text.replace(regex, value);
    }

    static trimEnd (text, end) {
        if (typeof text !== 'string' || typeof end !== 'string') {
            return this.toString(text);
        }
        const index = text.length - end.length;
        return text.lastIndexOf(end) === index
            ? text.substring(0, index)
            : text;
    }

    static toString (text) {
        return text === null || text === undefined ? '' : String(text);
    }
};