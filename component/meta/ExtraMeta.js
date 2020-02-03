/**
 * @copyright Copyright (c) 2020 Maxim Khorin (maksimovichu@gmail.com)
 */
'use strict';

const Base = require('areto/base/Component');

module.exports = class ExtraMeta extends Base {

    init () {
        this.metaHub = this.module.getMetaHub();
        this.metaHub.onAfterLoad(this.prepare.bind(this));
    }

    prepare () {
    }
};