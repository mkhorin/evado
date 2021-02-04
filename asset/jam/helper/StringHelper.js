/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
Jam.StringHelper = class StringHelper {

    static clearTags (text) {
        return typeof text === 'string' ? text.replace(/(<([^>]+)>)/ig, '') : text;
    }

    static escapeHtml (text) {
        if (typeof text !== 'string') {
            return text;
        }
        return text.replace(/&(?!#?[a-zA-Z0-9]+;)/g, '&amp;')
            .replace(/</g, '&lt;').replace(/>/g, '&gt;')
            .replace(/'/g, '&#39;').replace(/"/g, '&quot;');
    }

    static escapeTags (text) {
        return typeof text === 'string' ? text.replace(/</g, '&lt;').replace(/>/g, '&gt;') : text;
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