/**
 * @copyright Copyright (c) 2020 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

module.exports = class MetaParams {

    constructor () {
        this.master = {};
        this.security = null;
    }

    canReadAttr (attr, model) {
        return this.security.attrAccess.canRead(attr.name)
            && (!attr.relation || this.security.relationAccessMap[attr.name].canRead());
    }

    canUpdateAttr (attr, model) {
        return !model.readOnly
            && this.master.refAttr !== attr
            && !attr.isReadOnly()
            && this.security.attrAccess.canWrite(attr.name);
    }

    getMasterQueryParam () {
        return this.master.model
            ? `${this.master.attr.name}.${this.master.model.getViewMetaId()}`
            : '';
    }
};