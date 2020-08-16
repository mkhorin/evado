/**
 * @copyright Copyright (c) 2020 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

module.exports = class MetaParams {

    constructor () {
        this.master = {};
        this.security = null;
    }

    canReadAttr (attr) {
        return this.security.attrAccess.canRead(attr.name);
    }

    canReadRelation (attr) {
        return this.security.relationAccessMap[attr.name].canRead();
    }

    canUpdateAttr (attr, model) {
        return !model.readOnly
            && this.master.refAttr !== attr.classAttr
            && !attr.isReadOnly()
            && this.security.attrAccess.canWrite(attr.name);
    }

    getMasterId () {
        return this.master.model
            ? `${this.master.attr.name}.${this.master.model.getMetaId()}`
            : '';
    }
};