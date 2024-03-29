/**
 * @copyright Copyright (c) 2022 Maxim Khorin <maksimovichu@gmail.com>
 */
Jam.CookieHelper = class Helper {

    static get (name) {
        const data = name.replace(/([\.$?*|{}\(\)\[\]\\\/\+^])/g, '\\$1');
        const regex = new RegExp(`(?:^|; )${data}=([^;]*)`);
        const matches = document.cookie.match(regex);
        if (matches) {
            return decodeURIComponent(matches[1]);
        }
    }

    static set (name, value, options = {}) {
        options = {
            path: '/',
            ...options
        };
        if (options.expires instanceof Date) {
            options.expires = options.expires.toUTCString();
        }
        let cookie = `${encodeURIComponent(name)}=${encodeURIComponent(value)}`;
        for (const key of Object.keys(options)) {
            cookie += '; ' + key;
            if (options[key] !== true) {
                cookie += '=' + options[key];
            }
        }
        document.cookie = cookie;
    }
};