/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
Jam.UrlHelper = class UrlHelper {

    static getPageFrameUrl (frame, base) {
        return this.getPageUrl({frame}, base);
    }

    static openNewPageFrame () {
        this.openNewPage(this.getPageFrameUrl(...arguments));
    }

    static getPageUrl (data, base = location.href) {
        return this.addParams(base, data);
    }

    static openNewPage (url, data) {
        setTimeout(() => window.open(this.addParams(url, data), '_blank'), 0);
    }

    static addParams (url, data) {
        if (typeof data === 'string') {
            return data ? `${url}${url.includes('?') ? '&' : '?'}${data}` : url;
        }
        data = Object.assign(this.getParams(url), data);
        return `${this.getPath(url)}?${$.param(data)}`;
    }

    static getParams (url) {
        let data = String(url).split('?');
        data = data[1] || data[0];
        data = data.split('&');
        const params = {};
        for (let item of data) {
            item = item.split('=');
            if (item.length === 2) {
                params[item[0]] = decodeURIComponent(item[1]);
            }
        }
        return params;
    }

    static getPath (url) {
        const index = url.indexOf('?');
        return index === -1 ? url : url.substring(0, index);
    }
};