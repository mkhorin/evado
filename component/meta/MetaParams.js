/**
 * @copyright Copyright (c) 2020 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

module.exports = class MetaParams {

    constructor () {
        this.master = {};
        this.security = null;
    }

    isReadOnlyAttr (attr, model) {
        return model.readOnly
            || this.master.refAttr === attr
            || attr.isReadOnly()
            || this.security.attrAccess.canWrite(attr.name) !== true;
    }

    getMasterQueryParam () {
        return this.master.model
            ? `${this.master.attr.name}.${this.master.model.getViewMetaId()}`
            : '';
    }
};