/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const Base = require('areto/security/WebUser');

module.exports = class WebUser extends Base {

    getEmail () {
        return this.identity ? this.identity.getEmail() : undefined;
    }

    getAssignmentTitles () {
        const data = this.module.getRbac().itemTitleMap;
        return this.assignments.map(name => data[name]);
    }

    log () {
        return this.spawn('model/UserLog').create(this, ...arguments);
    }
};