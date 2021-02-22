/**
 * @copyright Copyright (c) 2021 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const Base = require('areto/view/Widget');

module.exports = class Languages extends Base {

    constructor (config) {
        super({
            cookieMaxAge: 3600 * 24 * 30,
            ...config
        });
    }

    execute () {
        return this.renderTemplate('_widget/languages', {
            items: this.items,
            active: this.getActiveItem()
        });
    }

    getActiveItem () {
        for (const item of this.items) {
            if (item.code === this.controller.language) {
                return item;
            }
        }
    }
};