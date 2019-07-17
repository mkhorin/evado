/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

module.exports = class MetaData {

    constructor () {
        this.node = null;        
        this.class = null;
        this.view = null;
        this.id = null;
        this.security = null;
        this.master = {            
            class: null,
            attr: null,
            id: null,
            model: null
        };
    }

    isReadOnlyAttr (attr, model) {
        return model.readOnly || attr.isReadOnly() || !this.security.attrAccess.canWrite(attr.name);
    }

    getMasterQueryParam () {
        return this.master.model ? `${this.master.attr.name}.${this.master.model.getClassMetaId()}` : '';
    }
};