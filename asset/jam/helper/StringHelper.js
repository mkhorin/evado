/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
Jam.StringHelper = class StringHelper {

    static HTML_REGEX = /&(?!#?[a-zA-Z0-9]+;)/g;
    static TAGS_REGEX = /(<([^>]+)>)/ig;
    static TAG_START_REGEX = /</g;
    static TAG_END_REGEX = />/g;
    static SINGLE_QUOTE_REGEX = /'/g;
    static DOUBLE_QUOTE_REGEX = /"/g;

    static clearTags (text) {
        return typeof text === 'string'
            ? text.replace(this.TAGS_REGEX, '')
            : text;
    }

    static escapeHtml (text) {
        if (typeof text !== 'string') {
            return text;
        }
        text = text.replace(this.HTML_REGEX, '&amp;');
        return this.escapeQuotes(this.escapeTags(text));
    }

    static escapeTags (text) {
        return typeof text === 'string'
            ? text.replace(this.TAG_START_REGEX, '&lt;')
                  .replace(this.TAG_END_REGEX, '&gt;')
            : text;
    }

    static escapeQuotes (text) {
        return typeof text === 'string'
            ? text.replace(this.SINGLE_QUOTE_REGEX, '&#39;')
                  .replace(this.DOUBLE_QUOTE_REGEX, '&quot;')
            : text;
    }

    static capitalize (str) {
        return str.charAt(0).toUpperCase() + str.slice(1);
    }

    static toLowerCaseFirstLetter (str) {
        return str.charAt(0).toLowerCase() + str.slice(1);
    }

    static replaceParam (str, param, value) {
        const regex = new RegExp(`{${param}}`, 'g');
        return str.replace(regex, value);
    }

    static trimEnd (text, end) {
        if (typeof text !== 'string' || typeof end !== 'string') {
            return text;
        }
        const index = text.length - end.length;
        return text.lastIndexOf(end) === index ? text.substring(0, index) : text;
    }
};