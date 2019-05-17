'use strict';

const Base = require('areto/base/Module');

module.exports = class BaseModule extends Base {

    getMeta () {
        return this.components.get('meta');
    }

    getMetaModel (name) {
        return this.getMeta().getModel(name);
    }
};