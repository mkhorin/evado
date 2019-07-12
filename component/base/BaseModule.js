/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const Base = require('areto/base/Module');

module.exports = class BaseModule extends Base {

    getTitle () {
        return this.label || super.getTitle();
    }

    getMeta () {
        return this.components.get('meta');
    }

    getMetaModel (name) {
        return this.getMeta().getModel(name);
    }
};