/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const Base = require('./MetaDataGrid');

module.exports = class MetaTreeDataGrid extends Base {

    static getConstants () {
        return {
            CLASS_KEY: '_node_class',
            HAS_CHILDREN_KEY: '_node_hasChildren'
        };
    }

    constructor () {
        super(...arguments);
        this.level = this.depth === undefined ? 0 : (this.depth + 1);
        this.level = this.metaData.treeView.getLevel(this.level);
    }

    async renderModel (model) {
        const data = {[this.CLASS_KEY]: model.class.id};
        if (this.level) {
            const query = this.level.refView.find(this.module);
            await this.level.refAttr.rel.setQueryByModel(query, model);
            // await this.metaData.security.access.filterObjects(query);
            data[this.HAS_CHILDREN_KEY] = !!await query.order(null).id();
        }
        return Object.assign(await super.renderModel(model), data);
    }
};
module.exports.init();