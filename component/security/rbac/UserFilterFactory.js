/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const Base = require('areto/base/Base');

module.exports = class UserFilterFactory extends Base {

    constructor (config) {
        super(config);
        this.config = this.data.spawnConfig || {};
        this.init();
    }

    init () {
        const file = this.config.Class;
        try {
            this.UserFilter = this.rbac.module.app.require(file) || require(file);
        } catch (err) {
            this.rbac.log('error', `Not found user filter: ${file}`);
        }
    }

    getId () {
        return this.data._id;
    }

    validate () {
        return !!this.UserFilter;
    }

    resolve (params) {
        return (new this.UserFilter({params, ...this.config})).execute();
    }
};