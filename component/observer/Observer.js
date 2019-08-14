/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const Base = require('areto/base/Base');

module.exports = class Observer extends Base {

    constructor (config) {
        super({
            ...config
        });
        this._listeners = [];
    }

    async init () {

    }

    catch (name, data) {

    }
};
module.exports.init();