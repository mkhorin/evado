/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
Jam.StringHelper = class StringHelper {

    static clearTags (text) {
        return typeof text === 'string'
            ? text.replace(Jam.StringHelper.TAGS_REGEX, '')
            : text;
    }

    static escapeHtml (text) {
        if (typeof text !== 'string') {
            return text;
        }
        text = text.replace(Jam.StringHelper.HTML_REGEX, '&amp;');
        return this.escapeQuotes(this.escapeTags(text));
    }

    static escapeTags (text) {
        return typeof text === 'string'
            ? text.replace(Jam.StringHelper.TAG_START_REGEX, '&lt;')
                  .replace(Jam.StringHelper.TAG_END_REGEX, '&gt;')
            : text;
    }

    static escapeQuotes (text) {
        return typeof text === 'string'
            ? text.replace(Jam.StringHelper.SINGLE_QUOTE_REGEX, '&#39;')
                  .replace(Jam.StringHelper.DOUBLE_QUOTE_REGEX, '&quot;')
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
};

Jam.StringHelper.HTML_REGEX = /&(?!#?[a-zA-Z0-9]+;)/g;
Jam.StringHelper.TAGS_REGEX = /(<([^>]+)>)/ig;
Jam.StringHelper.TAG_START_REGEX = /</g;
Jam.StringHelper.TAG_END_REGEX = />/g;
Jam.StringHelper.SINGLE_QUOTE_REGEX = /'/g;
Jam.StringHelper.DOUBLE_QUOTE_REGEX = /"/g;
