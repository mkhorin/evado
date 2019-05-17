'use strict';

const Base = require('areto/base/Base');

module.exports = class UserFilterFactory extends Base {

    constructor (config) {
        super(config);
        this.config = this.data.classConfig || {};
        this.init();
    }

    init () {
        try {
            this.UserFilter = this.rbac.module.app.require(this.config.Class);
        } catch (err) {
            this.rbac.log('error', `Invalid user filter: ${this.config.Class}`);
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