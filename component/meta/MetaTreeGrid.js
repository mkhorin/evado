/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const Base = require('./MetaGrid');

module.exports = class MetaTreeGrid extends Base {

    static getConstants () {
        return {
            CLASS_KEY: '_node_class',
            HAS_CHILDREN_KEY: '_node_hasChildren'
        };
    }

    constructor () {
        super(...arguments);
        const depth = this.depth === undefined ? 0 : (this.depth + 1);
        this.level = this.meta.treeView.getLevel(depth);
    }

    async renderModel (model) {
        const data = {[this.CLASS_KEY]: model.class.id};
        if (this.level) {
            const view = this.level.refView || this.level.refClass;
            const query = view.find();
            await this.level.refAttr.relation.setQueryByModel(query, model);
            // await this.security.access.assignObjectFilter(query);
            data[this.HAS_CHILDREN_KEY] = !!await query.order(null).id();
        }
        const result = await super.renderModel(model);
        return Object.assign(result, data);
    }
};
module.exports.init();