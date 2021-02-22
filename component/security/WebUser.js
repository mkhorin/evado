/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const Base = require('areto/security/WebUser');

module.exports = class WebUser extends Base {

    getAssignmentTitles () {
        const data = this.module.getRbac().itemTitleMap;
        return this.assignments.map(name => data[name]);
    }

    getEmail () {
        return this.identity?.getEmail();
    }

    getLanguage () {
        if (this.module.params.languageToggle) {
            return this.getCookie(this.module.params.languageCookie);
        }
    }

    log () {
        return this.spawn('model/UserLog').create(this, ...arguments);
    }
};